import { and, eq } from "drizzle-orm";
import { custom, string } from "zod";
import { db } from "../db/index";
import { loginLogs, sessions, users, passwords } from "../db/schema";
import Bowser from "bowser";
import bcrypt from "bcryptjs";
import redis from "./redis";
import { customAlphabet } from "nanoid";
import { Resend }  from "resend"

type NewUserArgs = {
  email: string;
  userName: string;
  fullName: string;
  profilePhoto: string;
  emailVerified: boolean;
};

type NewSessionArgs = {
  userId: string;
};

type NewLogsArgs = {
  userAgent: string | null;
  userId: string;
  sessionId: string;
  ip: string;
};


const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 14);

export async function throwError() {
  throw new Error("wtf");
}

export const createUser = async ({
  email,
  fullName,
  profilePhoto,
  userName,

}: NewUserArgs) => {
  try {
    const newUser = await db
      .insert(users)
      .values({
        email,
        profilePhoto,
        fullName,

        userName,
      })
      .returning({ id: users.id });

    return { userId: newUser[0].id };
  } catch (error) {
    throw new Error("Error while creating user");
  }
};



export const createSession = async ({ userId }: NewSessionArgs) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    const newSession = await db
      .insert(sessions)
      .values({
        userId,
        expiresAt: expiresAt.getTime(),
      })
      .returning({ id: sessions.id });

    return { sessionId: newSession[0].id, expiresAt };
  } catch (error) {
    throw new Error("Failed to create session");
  }
};

export const createLoginLog = async ({
  userAgent,
  userId,
  sessionId,
  ip,
}: NewLogsArgs) => {
  if (!userAgent) {
    throw new Error("Internal Error");
  }
  const parser = Bowser.getParser(userAgent);

  try {
    await db.insert(loginLogs).values({
      userId,
      sessionId,
      ip,
      os: `${parser.getOSName()} ${parser.getOSVersion()}`,
      browser: `${parser.getBrowserName()} ${parser.getBrowserVersion()}`,
      device: parser.getPlatformType(),
    });
  } catch (error) {
    throw new Error("Failed to create logs");
  }
};

export const createPassword = async ({
  password,
  userId,
}: {
  password: string;
  userId: string;
}) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.insert(passwords).values({
      userId,
      password: hashedPassword,
    });
  } catch (error) {
    console.log("Error while creating password", error);
    throw new Error("Error while creating password");
  }
};

const generateTokenId = customAlphabet("0123456789", 6);
/*const generateVerificationId = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 24);

export const sendVerificationMail = async ({ email }: { email: string }) => {
  const token = generateTokenId();
  const verificationId = generateVerificationId();

  try {
    const lastEmailSentTime: number | null = await redis.get(`${email}:sent`);
    console.log("lastEmailSentTime", lastEmailSentTime);

    if (lastEmailSentTime) {
      return {
        waitTime:
          10 - Math.floor((new Date().getTime() - lastEmailSentTime) / 60000),
      };

    }

    const emailSentCount: number | null = await redis.get(`${email}:count`);
    console.log("emailSentCount", emailSentCount);

    if (emailSentCount == null || emailSentCount > 0) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: import.meta.env.FROM_EMAIL,
          to: email,
          subject: `${token} is your email verification code`,
          html: `<div>The code for verification is ${token} </div>
          <div>The code is valid for only 1 hour</div>
          <div>You have received this email because you or someone tried to signup on the website </div>
          <div>If you didn't signup, kindly ignore this email.</div>
          <div>For support contact us at contact[at]example.com</div>
          `,
        }),
      });

      if (res.ok) {
        const verificationIdPromise = redis.set(
          verificationId,
          `${token}:${email}`,
          {
            ex: 3600,
          }
        );

        let emailCountPromise;

        if (emailSentCount === null) {
          emailCountPromise = redis.set(`${email}:count`, 4, {
            ex: 86400,
          });
        } else {
          emailCountPromise = redis.decr(`${email}:count`);
        }

        const emailSentPromise = redis.set(
          `${email}:sent`,
          new Date().getTime(),
          {
            ex: 600,
          }
        );

        const [res1, res2, res3] = await Promise.all([
          verificationIdPromise,
          emailCountPromise,
          emailSentPromise,
        ]);

        if (res1 && res2 && res3) {
          return { verificationId };
        } else {
          throw new Error("Error while sending email");
        }
      } else {
        throw new Error("Error while sending email");
      }
    } else {
      return { emailSendLimit: true };
    }
  } catch (error) {
    console.log("error while sending mail", error);
    throw new Error("Error while sending email");
  }

}; */

/*export const sendPasswordResetMail = async ({
  email,
  url,
  userExists,
}: {
  email: string;
  url: string;
  userExists: boolean;
}) => {
  const verificationId = generateVerificationId();

  try {
    const lastEmailSentTime: number | null = await redis.get(
      `${email}:pwd_reset_sent`
    );

    if (lastEmailSentTime) {
      return {
        waitTime:
          10 - Math.floor((new Date().getTime() - lastEmailSentTime) / 60000),
      };
    }

    const emailSentCount: number | null = await redis.get(
      `${email}:pwd_reset_count`
    );

    if (emailSentCount == null || emailSentCount > 0) {
      let res;

      if (userExists) {
        res = (await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "astro-auth@auth-noreply-alpha.rdrto.xyz",
            to: email,
            subject: `Password Reset Request`,
            html: `<div>Reset your password </div>
            <a href=${url}/forgot-password/${verificationId}>Reset Password</a>
            <div>The link is valid for only 1 hour</div>
            <div>You have received this email because you or someone tried to reset the password. </div>
            <div>If you didn't send this, firstly reset your password and contact support.</div>
            <div>For support contact us at contact[at]example.com</div>
            `,
          }),
        })) as Response;
      } else {
        setTimeout(() => {}, 200);
        res = {
          ok: true,
        };
      }

      if (res.ok) {
        const verificationIdPromise = redis.set(verificationId, email, {
          ex: 3600,
        });

        let emailCountPromise;

        if (emailSentCount === null) {
          emailCountPromise = redis.set(`${email}:pwd_reset_sent`, 4, {
            ex: 86400,
          });
        } else {
          emailCountPromise = redis.decr(`${email}:pwd_reset_sent`);
        }

        const emailSentPromise = redis.set(
          `${email}:pwd_reset_sent`,
          new Date().getTime(),
          {
            ex: 600,
          }
        );

        const [res1, res2, res3] = await Promise.all([
          verificationIdPromise,
          emailCountPromise,
          emailSentPromise,
        ]);

        if (res1 && res2 && res3) {
          return { verificationId };
        } else {
          throw new Error("Error while sending mail");
        }
      } else {
        throw new Error("Error while sending mail");
      }
    } else {
      return { emailSendLimit: true };
    }
  } catch (error) {
    console.log("error while sending mail", error);
    throw new Error("Error while sending mail");
  }
};*/
    

  

