"""Gunicorn configuration file for partaj."""
import os


port = os.environ['PORT'] or "8080"

# Gunicorn-django settings
bind = [f"0.0.0.0:{port}"]
name = "partaj"
python_path = "/app"

# Run
graceful_timeout = 90
timeout = 90
workers = 3
worker_class = "gthread"
worker_tmp_dir = "/dev/shm"
threads = 6

# Logging
# Using '-' for the access log file makes gunicorn log accesses to stdout
accesslog = "-"
# Using '-' for the error log file makes gunicorn log errors to stderr
errorlog = "-"
loglevel = "info"
