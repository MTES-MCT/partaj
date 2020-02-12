# Create an SSH key pair resource (enables logging into our instances)
resource "openstack_compute_keypair_v2" "partaj_keypair" {
  provider = "openstack.ovh"
  region = "${var.ovh_region_suffix}"
  name = "partaj_${terraform.workspace}_keypair"

  public_key = "${file("./.ssh/partaj.pub")}"
}

# Create an OpenStack instance
resource "openstack_compute_instance_v2" "partaj_instance" {
  provider = "openstack.ovh"
  region = "${var.ovh_region_suffix}"
  name = "partaj_${terraform.workspace}_instance"

  image_name = "Ubuntu 18.04"
  flavor_name = "b2-7"
  key_pair = "${openstack_compute_keypair_v2.partaj_keypair.name}"
  network {
    name = "Ext-Net" # Add the network component to contact your machine
  }
}
