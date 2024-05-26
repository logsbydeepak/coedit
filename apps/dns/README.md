# @coedit/dns

## Local

```bash
bun run dev
```

Test

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

Add environment variables before copying. Otherwise, you can edit the file after copying.

```bash
# using nano
sudo nano /etc/coedit-ns.env
# using vim
sudo vim /etc/coedit-ns.env
```

Command to manage service

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
