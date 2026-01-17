from flask import Flask, render_template
from flask_restful import Resource, Api, reqparse
import json
import datetime

class DB:
    def __init__(self, filename: str = "db.json"):
        self.filename = filename
        self.timestamps = []

    def load_file(self):
        try:
            with open(self.filename, "r") as fp:
                self.timestamps = json.load(fp)
        except:
            pass

    def write_file(self):
        with open(self.filename, "w") as fp:
            json.dump(self.timestamps, fp)

    def get_last(self):
        if len(self.timestamps) == 0:
            self.add_timestamp("uncategorized", allow_duplicate=True)
        return self.timestamps[-1]

    def add_timestamp(self, activity: str, allow_duplicate: bool = False):
        if not allow_duplicate and self.get_last()["activity"] == activity:
            return
        now = datetime.datetime.now()
        timestamp = {
            "posix": now.timestamp(),
            "activity": activity
        }
        self.timestamps.append(timestamp)

app = Flask(__name__)
app.template_folder = "templates"
app.static_folder = "static"
db = DB()
db.load_file()

class Activity(Resource):
    def get(self):
        return db.get_last(), 200

    def put(self):
        parser = reqparse.RequestParser(bundle_errors=True)
        parser.add_argument("activity", type=str, required=True)
        args = parser.parse_args()
        db.add_timestamp(args["activity"])
        db.write_file()
        return db.get_last(), 200

api = Api(app)
api.add_resource(Activity, "/api/activity")

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
