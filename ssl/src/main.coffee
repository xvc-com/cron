#!/usr/bin/env coffee

> @3-/acme
  @3-/alissl
  ./CONF.js > DNS_HOST
  os > homedir
  path > join
  fs > existsSync rmSync



export default main = =>
  {
    MAIL
    RSYNC_HOST_LI
  } = process.env

  await acme(MAIL, DNS_HOST)

  err_count = 0
  for [project, upload] from Object.entries {
    alissl
    # baidussl
    # dogessl
  }
    try
      await upload()
    catch err
      err_count += 1
      console.error project, err

  {
    stdout
  } = await $'git remote get-url origin'

  org = stdout.trimEnd().split('/').at(-2)

  await $"mkdir -p tmp && cd tmp && rm -rf ssl && rsync -avz ~/.acme.sh/*_ecc ssl/ &&  cd ssl && git init && git add . && git add -u && git commit -minit && git branch -M main && git remote add origin git@github.com:#{org}/ssl.git && git push origin main -f"

  await Promise.all RSYNC_HOST_LI.split(' ').map (host)=>
    try
      await $"rsync --mkpath -avz ~/.acme.sh/*_ecc #{host}:/mnt/www/.acme.sh/"
      await $"ssh #{host} 'cmd=$(command -v openresty || command -v nginx) && [ -n $cmd ] && cmd=$(basename $cmd) && systemctl reload $cmd && echo #{host} restart $cmd'"
    catch err
      console.error host, err
      err_count += 1
    return

  return err_count

if process.argv[1] == decodeURI (new URL(import.meta.url)).pathname
  process.exit(
    await main()
  )

  # @3-/dogessl
  # @3-/baidussl
  # @3-/hwdns/acme.js:hwacme


# ROOT = process.cwd()
#
# {
#   CONF
#   MAIL
#   NODE_ENV
# } = process.env
#
#
# SSH = "sshpass -e ssh -q -o StrictHostKeyChecking=no -F "+join CONF, 'ssh_config'
#
#
# # known_hosts = join HOME, '.ssh/known_hosts'
# # if not existsSync known_hosts
# #   await $"mkdir -p ~/.ssh && touch #{known_hosts} && chmod -R 700 ~/.ssh"
#
#
# # HOST_ALL = new Set
#
# # rsync = (host, pc)=>
# #   HOST_ALL.add pc
# #   $raw"""rsync -e "#{SSH}" --exclude='*.conf' --chown=ssl:ssl --chmod=750 --delete -avz ~/.acme.sh/#{host}_ecc ssl@#{pc}:/opt/ssl"""
# #
#
#
#
#
# if not IS_DEV
#   rsync = retry rsync
#   issue = retry _issue
#
# hwIssue = (dns, host)=>
#   enable = await hwacme(host)
#   try
#     return await issue(dns, host)
#   finally
#     await enable()
#   return
#
#
# id_ed25519 = join(ROOT,'conf/ssh/id_ed25519')
#
# await $"chmod 600 #{id_ed25519}"
# process.env.GIT_SSH_COMMAND="ssh -i #{id_ed25519}"
#
#
# for i from readdirSync adir
#   if i.endsWith '_ecc'
#     await $"rm -rf #{i} && cp -R #{adir}/#{i} #{i}"
#
# await $"git config user.email i18n.site@gmail.com && git config user.name i18n && git add . && git commit -m '#{new Date().toISOString().slice(0,10)}' && git push"
#
# err_count = 0
#
# for [project, upload] from Object.entries {
#   alissl
#   baidussl
#   dogessl
# }
#   try
#     await upload()
#   catch err
#     err_count += 1
#     console.error project, err
#
