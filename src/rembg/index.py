import boto3
import os
import json
from rembg import remove


def handler(event, context):
    s3 = boto3.client('s3')
    sqs = boto3.client('sqs')

    # Loops through every file uploaded
    for record in event['Records']:
        receipt_handle = record["receiptHandle"]
        body = json.loads(record["body"])

        token = body["token"]
        print(f"Processing message: {token}")

        data = s3.get_object(
            Bucket=os.environ["WOW_EMOJI_DATA_S3_BUCKET"], Key=f"{token}-input")

        print("Removing background")

        # Remove background
        input = data["Body"].read()
        output = remove(input)

        # Save to S3
        s3.put_object(Bucket=os.environ["WOW_EMOJI_DATA_S3_BUCKET"],
                      Key=f"{token}-input-rembg", Body=output)

        # Add new message to next SQS queue
        sqs.send_message(QueueUrl=os.environ["WOW_EMOJI_COMBINER_INPUT_QUEUE"],
                         MessageBody=record["body"])

        # Remove original message from SQS queue
        sqs.delete_message(QueueUrl=os.environ["WOW_EMOJI_REMBG_INPUT_QUEUE"],
                           ReceiptHandle=receipt_handle)
