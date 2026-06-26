// rate limitimng , prompt injection 

import arcjet , {
    tokenBucket,
    detectPromptInjection,
    sensitiveInfo
} from "@arcjet/next"


export const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    characteristics: ["userId"],
    rules:[
        tokenBucket({
            mode:"LIVE",
            refillRate: 5, // refill 5 tokens every
            interval: 60, // 60 second
            capacity: 5, // max 5 burst

        }),

        detectPromptInjection({
            mode: "LIVE",

        }),
        sensitiveInfo({
            mode: "LIVE",
            deny: ["credit_card", "social_security_number", "password", "api_key"],
        })
    ],
});