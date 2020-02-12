# Region name for some OVH services (such as object stoage)
# NB: region names are inconsistent depending on resource types
variable "ovh_region" {
  type    = "string"
  default = "GRA"
}

# Region name for some OVH services (such as compute)
# NB: region names are inconsistent depending on resource types
variable "ovh_region_suffix" {
  type    = "string"
  default = "GRA7"
}
