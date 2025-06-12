from flask import Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

# Add a route for Prometheus metrics
def register_metrics_route(app):
    @app.route('/metrics')
    def metrics():
        return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
