import DnsModule, {
  AddDomainRecordRequest,
  DeleteDomainRecordRequest,
} from "@alicloud/alidns20150109";
import { Config } from "@alicloud/openapi-client";

const Dns = DnsModule.default || DnsModule;

const ali_key = process.env.Ali_Key?.trim(),
  ali_secret = process.env.Ali_Secret?.trim(),
  client = new Dns(
    new Config({
      accessKeyId: ali_key,
      accessKeySecret: ali_secret,
      endpoint: "alidns.aliyuncs.com",
    }),
  );

export default {
  ali: (domain) => {
    const records = [];
    return [
      async (type, name, content) => {
        if (name.endsWith(`.${domain}`)) {
          name = name.slice(0, -domain.length - 1);
        }
        console.log(`AddDomainRecord: ${domain} ${name} ${type} ${content}`);
        try {
          const req = new AddDomainRecordRequest({
              domainName: domain,
              RR: name,
              type: type,
              value: content,
            }),
            res = await client.addDomainRecord(req),
            record_id = res?.body?.recordId;
          console.log(`AddDomainRecord result: ${record_id}`);
          if (record_id) records.push(record_id);
        } catch (e) {
          // 容忍由于进程被中止等原因遗留的旧记录导致重叠添加引发的错误
          if (e.code !== "DomainRecordDuplicate") throw e;
          console.log(`AddDomainRecord duplicate: ${domain} ${name}`);
        }
      },
      async () => {
        console.log(`DeleteDomainRecords for ${domain}: ${records.length}`);
        for (const record_id of records) {
          try {
            await client.deleteDomainRecord(new DeleteDomainRecordRequest({ recordId: record_id }));
            console.log(`Deleted record: ${record_id}`);
          } catch (e) {
            console.error(`Delete record error: ${record_id}`, e);
          }
        }
        records.length = 0;
      },
    ];
  },
};
