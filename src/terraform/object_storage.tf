# resource "openstack_identity_role_v3" "partaj_uploads_read_write_role" {
#   provider = "openstack.ovh"
#   region = "${var.ovh_region}"
#   name = "partaj_${terraform.workspace}_uploads_read_write_role"
# }

# Create a bucket to store partaj user documents
resource "openstack_objectstorage_container_v1" "partaj_uploads" {
  provider = "openstack.ovh"
  region = "${var.ovh_region}"
  name   = "partaj_${terraform.workspace}_uploads"
}
