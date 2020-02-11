## Managing environments with terraform

### Scope

Partaj can run on a VM through `docker-compose up`. This is pretty straightforward and can rely on a single machine with no further tooling as we operate our alpha version.

The app handles files uploaded by users. To do this easily, it needs access to an object storage service that will be provided by OVH.

### Getting started

We use a custom image based on Ubuntu to run OpenStack CLI tools without installing them locally:

```bash
docker build ../../docker/images/terraform/openstack-cli -t openstack-cli
```

This will build our `openstack-cli` image and ensure you can use it to run all OpenStack tools such as eg. `nova` or `glance`.

You can now run OpenStack CLI commands directly from the `terraform` directory, which passes appropriate flags as well as environment variables as defined in `env.d/development`.

```
bin/openstack nova flavor-list
```

For the same reason, we also added a `terraform` helper:

```
bin/terraform apply
```
