# TimeLimit-Server

This is the server for the connected mode in TimeLimit.

This Readme became too long. Due to that, it was split into [mutliple files](https://codeberg.org/timelimit/timelimit-server/src/branch/master/docs/usage).


### Usage Docker

```shell
$ docker pull ghcr.io/michaelsp/timelimit-server/timelimit:v1.17.0
```

[Latest Docker image version](https://github.com/MichaelSp/timelimit-server/pkgs/container/timelimit-server%2Ftimelimit)

### Usage Helm

```
helm repo add timelimit https://michaelsp.github.io/timelimit-server/
helm install timelimit timelimit/timelimit
```

Please find [the `values.yaml` here](charts/timelimit/values.yaml).