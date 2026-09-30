#!/usr/bin/env python3
import os
import sys
import io
import gzip
import json
import time
import argparse
import datetime
import requests
import pandas as pd
import boto3
from botocore.config import Config

def get_target_date():
    today = datetime.date.today()
    if today.weekday() == 5:
        today -= datetime.timedelta(days=1)
    elif today.weekday() == 6:
        today -= datetime.timedelta(days=2)
    return today

def parse_date(date_str):
    if not date_str or not date_str.strip():
        return None
    return datetime.datetime.strptime(date_str.strip(), "%Y-%m-%d").date()

def download_nse_bhavcopy(target_date, session=None):
    date_str = target_date.strftime("%d%m%Y")
    url = f"https://archives.nseindia.com/products/content/sec_bhavdata_full_{date_str}.csv"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Referer": "https://www.nseindia.com/",
    }
    if session is None:
        session = requests.Session()
        try:
            session.get("https://www.nseindia.com", headers=headers, timeout=10)
        except Exception:
            pass

    print(f"[*] Downloading NSE Bhavcopy for date: {target_date}...")
    try:
        res = session.get(url, headers=headers, timeout=25)
        if res.status_code == 200 and len(res.text) > 1000:
            print(f"[+] Download successful ({len(res.content)} bytes).")
            return res.text
    except Exception as e:
        print(f"[!] Warning on {target_date}: {e}")
    return None

def parse_bhavcopy(csv_text, target_date):
    records = {}
    date_iso = target_date.strftime("%Y-%m-%d")
    if not csv_text:
        return records
    try:
        df = pd.read_csv(io.StringIO(csv_text))
        df.columns = df.columns.str.strip()
        if "SERIES" in df.columns:
            df = df[df["SERIES"].str.strip() == "EQ"]

        for _, row in df.iterrows():
            sym = str(row.get("SYMBOL", "")).strip().upper()
            if not sym:
                continue
            records[sym] = {
                "date": date_iso,
                "open": round(float(row.get("OPEN_PRICE", row.get("OPEN", 0))), 2),
                "high": round(float(row.get("HIGH_PRICE", row.get("HIGH", 0))), 2),
                "low": round(float(row.get("LOW_PRICE", row.get("LOW", 0))), 2),
                "close": round(float(row.get("CLOSE_PRICE", row.get("CLOSE", 0))), 2),
                "volume": int(row.get("TTL_TRD_QNTY", row.get("TOTTRDQ", 0))),
                "deliveryQty": int(row.get("DELIV_QTY", 0)),
                "deliveryPct": round(float(row.get("DELIV_PER", 0)), 1),
            }
    except Exception as e:
        print(f"[!] Parse error: {e}")
    return records

def get_r2_client():
    account_id = os.environ.get("R2_ACCOUNT_ID")
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
    bucket_name = os.environ.get("R2_BUCKET_NAME", "bhavcopy-store")
    if not all([account_id, access_key, secret_key]):
        return None, bucket_name
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
    s3_client = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
    )
    return s3_client, bucket_name

def upload_bundle(s3_client, bucket_name, data, key, is_immutable=False):
    if s3_client is None:
        print(f"[Simulated] Upload {key} to {bucket_name}")
        return
    json_bytes = json.dumps(data).encode("utf-8")
    gz_buf = io.BytesIO()
    with gzip.GzipFile(fileobj=gz_buf, mode="wb") as gz:
        gz.write(json_bytes)
    cache = "public, max-age=31536000, immutable" if is_immutable else "public, max-age=3600"
    s3_client.put_object(
        Bucket=bucket_name,
        Key=key,
        Body=gz_buf.getvalue(),
        ContentType="application/gzip",
        ContentEncoding="gzip",
        CacheControl=cache,
    )

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-date", type=str, default="")
    parser.add_argument("--end-date", type=str, default="")
    args = parser.parse_args()

    s3, bucket = get_r2_client()
    start_d = parse_date(args.start_date)
    end_d = parse_date(args.end_date)

    if start_d and end_d:
        cur = start_d
        range_data = {}
        session = requests.Session()
        while cur <= end_d:
            if cur.weekday() not in (5, 6):
                raw = download_nse_bhavcopy(cur, session)
                day_recs = parse_bhavcopy(raw, cur)
                for sym, bar in day_recs.items():
                    if sym not in range_data:
                        range_data[sym] = []
                    range_data[sym].append(bar)
                time.sleep(0.4)
            cur += datetime.timedelta(days=1)
        upload_bundle(s3, bucket, range_data, "data/eod_latest.json.gz", False)
    else:
        target = start_d or get_target_date()
        raw = download_nse_bhavcopy(target)
        recs = parse_bhavcopy(raw, target)
        upload_bundle(s3, bucket, recs, "data/eod_latest.json.gz", False)

if __name__ == "__main__":
    main()
