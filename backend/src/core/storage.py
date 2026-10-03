from src.core.settings import settings
from botocore.config import Config
from botocore.exceptions import ClientError
import boto3

s3_client = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint_url,
    aws_access_key_id=settings.s3_access_key_id,
    aws_secret_access_key=settings.s3_secret_access_key,
    region_name=settings.s3_region,
    config=Config(s3={"addressing_style": "path"}),
)


def ensure_bucket_exists() -> None:
    try:
        s3_client.head_bucket(Bucket=settings.s3_bucket_name)
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")
        status_code = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        if error_code not in {"404", "NoSuchBucket", "NotFound"} and status_code != 404:
            raise
        try:
            s3_client.create_bucket(Bucket=settings.s3_bucket_name)
        except ClientError as create_exc:
            create_code = create_exc.response.get("Error", {}).get("Code")
            if create_code not in {"BucketAlreadyExists", "BucketAlreadyOwnedByYou"}:
                raise


def upload_object(object_name: str, content: bytes, content_type: str) -> None:
    s3_client.put_object(
        Bucket=settings.s3_bucket_name,
        Key=object_name,
        Body=content,
        ContentType=content_type,
    )


def delete_object(object_name: str) -> None:
    s3_client.delete_object(Bucket=settings.s3_bucket_name, Key=object_name)
