// @ts-ignore
import whois from "whois";
import { ERRORS } from "./constants";
import { WhoisClient } from "./libraries/WhoisClient";
import { WhoisData, WhoisResponse } from "./libraries/WhoisData";

const whoisClient = async (domain: string, options: object = {}): Promise<{ [key: string]: string }> => {
    const whoisClient = new WhoisClient()
    let jsonResponse = {}

    if (!domain || domain.trim() === "") {
        throw new Error(ERRORS.NoDomainError)
    }

    console.log(domain, options)

    try {
        jsonResponse = await whoisClient.query(domain, options)
    } catch (error) {
        throw error
    }

    console.log(jsonResponse)

    if (typeof jsonResponse === "object" && Object.keys(jsonResponse).length === 0) {
        throw new Error(ERRORS.WhoisResponseEmpty)
    }

    return jsonResponse
};

export { whoisClient, WhoisClient, WhoisData, WhoisResponse };
