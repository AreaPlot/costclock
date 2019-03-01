#!/usr/bin/env python3

import sys, os
from flup.server.fcgi import WSGIServer
from flask import Flask, g, Response
import psycopg2
import psycopg2.extras
import psycopg2.pool
from contextlib import contextmanager

## database
pool = psycopg2.pool.ThreadedConnectionPool(1, 20, 
          service="salary" )

@contextmanager
def get_db_connection():
    try: 
        connection = pool.getconn() 
        yield connection 
    finally: 
        pool.putconn(connection)

@contextmanager
def get_db_cursor(commit=False): 
    with get_db_connection() as connection:
      cursor = connection.cursor(
                  cursor_factory=psycopg2.extras.RealDictCursor)
      try: 
          yield cursor 
          if commit: 
              connection.commit() 
      finally: 
          cursor.close()


app = Flask(__name__)

@app.route("/search/<string:terms>")
def search(terms):
    sql = """
with squery as (
   select name, basesalary::numeric::int, department, organization, jobtitle, source
        , md5(textin(record_out( salary ))) AS hash
     from salary
    where plainto_tsquery(%s) @@ search_vector
    limit 50
)
select json_agg(
   row_to_json(
      squery
    )
)::text as data
from squery;
"""
    responseheaders = {
            "Content-Type": "application/json",
            "Cache-Control": "public",
            "Access-Control-Allow-Origin": "*"
        } 

    if isinstance(terms, str) and len(terms) >=3:
        with get_db_cursor() as cur:
            cur.execute(sql, (terms,))
            records = [x for x in cur.fetchall()]
            return Response(records[0]['data'], headers=responseheaders)
    else:
        return Response({}, headers=responseheaders)

if __name__ == '__main__':
    WSGIServer(app).run()
