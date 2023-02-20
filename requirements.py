"""
The python buildpack we're using to deploy Partaj to Scalingo expects a requirements.txt file,
not a setup.cfg file.
We'd rather not alter our project too much to conform to some buildpack's constraints.

Instead, we can use configparser to generate a requirements.txt file from our setup.cfg.
"""
import configparser


# Write the raw list of runtime to a runtime.txt file in the deployment directory
runtime_file = open('../deployment/runtime.txt', 'w')
runtime_file.write("python-3.9.9")
runtime_file.close()

# Read our setup.cfg file
config = configparser.ConfigParser()
config.read("src/backend/setup.cfg")

# Write the raw list of requirements to a requirements.txt file in the deployment directory
requirements_file = open('../deployment/requirements.txt', 'w')
requirements_file.write(config["options"]["install_requires"])
requirements_file.close()
