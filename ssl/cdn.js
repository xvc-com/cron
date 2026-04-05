import CdnModule, {
  DescribeUserDomainsRequest,
  SetCdnDomainSSLCertificateRequest,
  DescribeCdnHttpsDomainListRequest,
} from "@alicloud/cdn20180510";
import { Config } from "@alicloud/openapi-client";

const Cdn = CdnModule.default || CdnModule;

const ali_key = process.env.Ali_Key?.trim(),
  ali_secret = process.env.Ali_Secret?.trim(),
  client = new Cdn(
    new Config({
      accessKeyId: ali_key,
      accessKeySecret: ali_secret,
      endpoint: "cdn.aliyuncs.com",
    }),
  ),
  paginate = async (fn, extract, size = 100) => {
    const items = [];
    let page = 1;
    for (;;) {
      const { body } = await fn(page, size),
        list = extract(body) || [];
      items.push(...list);
      if (list.length < size) break;
      page++;
    }
    return items;
  },
  allDomains = () =>
    paginate(
      (page, size) =>
        client.describeUserDomains(
          new DescribeUserDomainsRequest({ pageNumber: page, pageSize: size }),
        ),
      (body) => body?.domains?.pageData,
      500,
    ),
  httpsCerts = () =>
    paginate(
      (page, size) =>
        client.describeCdnHttpsDomainList(
          new DescribeCdnHttpsDomainListRequest({ pageNumber: page, pageSize: size }),
        ),
      (body) => body?.certInfos?.certInfo,
    ),
  domainMatch = (cert_domain, cdn_domain) => {
    if (cert_domain === cdn_domain) return true;
    if (cdn_domain === `*.${cert_domain}`) return true;
    return cdn_domain.endsWith(`.${cert_domain}`);
  },
  bind = async (name, cert_domain, key, crt) => {
    await client.setCdnDomainSSLCertificate(
      new SetCdnDomainSSLCertificateRequest({
        domainName: name,
        SSLProtocol: "on",
        certType: "upload",
        certName: `${cert_domain}-${Date.now()}`,
        SSLPub: crt,
        SSLPri: key,
      }),
    );
    console.log("cdn bind", name, "<-", cert_domain);
  },
  unbind = async (name) => {
    await client.setCdnDomainSSLCertificate(
      new SetCdnDomainSSLCertificateRequest({ domainName: name, SSLProtocol: "off" }),
    );
    console.log("cdn clean", name);
  };

export default async (updates) => {
  const all_domains = await allDomains(),
    certs = await httpsCerts(),
    https_certs = new Map(certs.map((i) => [i.domainName, i.certStatus]));

  let bound = 0,
    cleaned = 0;
  for (const { domainStatus: domain_status, domainName: domain_name } of all_domains) {
    if (domain_status !== "online") continue;
    const cert_status = https_certs.get(domain_name);
    if (cert_status === "ok") continue;
    let matched = false
    for (const [cert_domain, [key, crt]] of updates) {
      if (domainMatch(cert_domain, domain_name)) {
        await bind(domain_name, cert_domain, key, crt)
        bound++
        matched = true
        break
      }
    }
    
    if (!matched && cert_status === "expired") {
      await unbind(domain_name)
      cleaned++
    }
  }

  console.log(`cdn: bound=${bound} cleaned=${cleaned}`);
};
