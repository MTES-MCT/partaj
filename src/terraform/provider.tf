# Configure the OpenStack provider hosted by OVH
provider "openstack" {
  auth_url = "https://auth.cloud.ovh.net/v3"
  domain_name = "default" # Domain Name - Always "default" for OVH
  alias = "ovh"
}
