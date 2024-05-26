# @coedit/dns

## Local

```bash
bun run dev
```

## Test

```bash
dig @localhost test.{ DOMAIN }
```

## Deploy

Build

```bash
bun run build

```

Security group

- Inbound
  - UDP 53
  - SSH 22

Copy file from host

```bash
scp -i { PRIVATE KEY } -r coedit-ns.env coedit-ns.service dist/coedit-ns { USER }@{ IP }:
```

Inside instance

```bash
sudo mv ~/coedit-ns /usr/local/bin/
sudo mv ~/coedit-ns.env /etc/
sudo mv ~/coedit-ns.service /etc/systemd/system
```

[coedit-ns.service](coedit-ns.service) path: `/etc/systemd/system/coedit-ns.service`

[coedit-ns.env](coedit-ns.env) path: `/etc/coedit-ns.env`

```bash
# reload service file to include new changes
sudo systemctl daemon-reload
# start service
sudo systemctl start coedit-ns
# check status of service
sudo systemctl status coedit-ns
# restart service
sudo systemctl restart coedit-ns
# enable service to start on boot
sudo systemctl enable coedit-ns
# disable service to not start on boot
sudo systemctl disable coedit-ns

# check journal logs
sudo journalctl -u coedit-ns
```

Test if running

```bash
dig test.{ DOMAIN }
```
