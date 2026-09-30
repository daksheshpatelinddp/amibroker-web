"""
NSE Bhavcopy to Cloudflare R2 Ingestion Script
Fetches daily Bhavcopy zip/csv from NSE and syncs to R2 storage
"""
import os
import requests
import boto3
from datetime import datetime

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET = os.getenv("R2_BUCKET", "bhavcopy-store")

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
    )

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"Checking NSE Bhavcopy sync for {today}...")

if __name__ == "__main__":
    main()
