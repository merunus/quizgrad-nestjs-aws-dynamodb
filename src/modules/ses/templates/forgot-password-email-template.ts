export const getForgotPasswordHTMLTemplate = (resetLink: string) => {
  const htmlContent = `
      <html>
        <body>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
        </body>
      </html>
    `;

  return htmlContent;
};
