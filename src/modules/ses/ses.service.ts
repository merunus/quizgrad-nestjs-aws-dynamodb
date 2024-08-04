import { SendEmailCommand, SendEmailCommandInput, SESClient } from "@aws-sdk/client-ses";
import { Injectable } from "@nestjs/common";
import { RESPONSE_TYPES } from "src/models/responseTypes";
import { throwHttpException } from "src/utils/throwHttpException";

@Injectable()
export class SimpleEmailService {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  getSESClient(): SESClient {
    return this.sesClient;
  }

  async sendEmailToUser(to: string, subject: string, bodyHtml: string): Promise<void> {
    const params: SendEmailCommandInput = {
      Destination: {
        ToAddresses: [to] // Emails to which the email will go
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: bodyHtml
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject
        }
      },
      Source: "dimalebedev6902@gmail.com" //! TODO Add to env file // Replace with your verified email address
    };

    try {
      const command = new SendEmailCommand(params);
      await this.sesClient.send(command);
    } catch (error) {
      console.log(error);
      throwHttpException(
        RESPONSE_TYPES.SERVER_ERROR,
        `Failed to send email to ${to} about ${subject}`
      );
    }
  }
}
