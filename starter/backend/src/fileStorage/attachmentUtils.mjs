// TODO: Implement: fileStorage
const s3_bucket_name = process.env.ATTACHMENT_S3_BUCKET

export class AttachmentUtils {
  constructor(bucket_name = s3_bucket_name) {
    this.bucket_name = bucket_name
  }

  // Get attachment URL
  getAttachmentUrl(todoId) {
    return 'https://' + this.bucket_name + '.s3.amazonaws.com/' + todoId
  }
}
