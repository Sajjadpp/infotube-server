const nodemailer = require("nodemailer")

const createEmail = async(email, comment) => {
    console.log(process.env.EMAIL, process.env.pass_NODEMAILER)

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for port 465, false for other ports
        requireTLS: true,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.pass_NODEMAILER,
        },
    });
      
    // send mail with defined transport object
   try{
        const info = await transporter.sendMail({
            from: process.env.EMAIL, // sender address
            to: email, // list of receivers
            subject: "Hello", // Subject line
            text: "", // plain text body
            html: commentReplay(comment) // html body
        });
        
        console.log("Message sent: %s", info.messageId);
        // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
        return info.accepted.length > 0
   }
   catch(err){
    console.log(err, "error in send")
    return false
   }
}

function commentReplay(data) {
    // Generate HTML for comment reply notification
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Reply to Your Comment</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #f8f8f8;
                padding: 20px;
                text-align: center;
                border-bottom: 1px solid #dddddd;
            }
            .content {
                padding: 20px;
                background-color: #ffffff;
            }
            .comment-card {
                background-color: #f8f8f8;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                border-left: 4px solid #dddddd;
            }
            .reply-card {
                background-color: #f0f0f0;
                border-radius: 8px;
                padding: 15px;
                margin-left: 20px;
                border-left: 4px solid #cccccc;
            }
            .user-info {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #dddddd;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
                font-weight: bold;
                color: #666666;
            }
            .username {
                font-weight: bold;
                margin-right: 10px;
            }
            .timestamp {
                color: #777777;
                font-size: 12px;
            }
            .comment-content {
                margin-top: 10px;
                word-wrap: break-word;
            }
            .button {
                display: inline-block;
                background-color: #4d4d4d;
                color: #ffffff !important;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 4px;
                margin-top: 20px;
                font-weight: bold;
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #777777;
                background-color: #f8f8f8;
                border-top: 1px solid #dddddd;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Reply to Your Comment</h1>
            </div>
            
            <div class="content">
                <p>Hello ${data.recipientName},</p>
                
                <p><strong>${data.replierName}</strong> has replied to your comment on the video <strong>"${data.videoTitle}"</strong>.</p>
                
                <div class="comment-card">
                    <div class="user-info">
                        <div class="user-avatar">${data.recipientName.charAt(0).toUpperCase()}</div>
                        <div>
                            <span class="username">${data.recipientName}</span>
                            <span class="timestamp">${data.originalCommentDate}</span>
                        </div>
                    </div>
                    <div class="comment-content">${data.originalCommentContent}</div>
                </div>
                
                <div class="reply-card">
                    <div class="user-info">
                        <div class="user-avatar">${data.replierName.charAt(0).toUpperCase()}</div>
                        <div>
                            <span class="username">${data.replierName}</span>
                            <span class="timestamp">${data.replyDate}</span>
                        </div>
                    </div>
                    <div class="comment-content">${data.replyContent}</div>
                </div>
                
                <p>Want to continue the conversation?</p>
                
                <a href="${data.videoUrl}" class="button">View conversation</a>
                
                <p>Thank you for being part of our community!</p>
            </div>
            
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${data.companyName || 'Video Platform'}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return html;
}

// Function to send comment reply notification
const sendCommentReplyNotification = async (recipientEmail, commentData) => {
    // Create HTML email content
    const emailHtml = commentReplay(commentData);
    
    // Send email using the existing createEmail function
    return await createEmail(recipientEmail, emailHtml);
};

module.exports = {
    createEmail,
    commentReplay,
    sendCommentReplyNotification
};