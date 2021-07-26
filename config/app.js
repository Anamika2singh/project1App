require('dotenv').config()
// console.log(process.env.PORT)
module.exports= {
    PORT:process.env.PORT,
    MONGODB_URL:process.env.MONGODB_URL,
    LOG_SECRET_KEY :process.env.LOG_SECRET_KEY,
    S3_BUCKET_ACCESS_KEY : process.env.S3_BUCKET_ACCESS_KEY,
    S3_BUCKET_SECRET_ACCESS_KEY : process.env.S3_BUCKET_SECRET_ACCESS_KEY,
    S3_BUCKET_REGION  : process.env.S3_BUCKET_REGION,
    S3_BUCKET_NAME : process.env.S3_BUCKET_NAME 
}
