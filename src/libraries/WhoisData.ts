import {decode} from "html-entities";
import {camelCase} from "change-case";

class WhoisData {
  public parse(rawData: string) {
    const decodedRawData: string = decode(rawData)

    let result: { [key: string]: string } = {};

    decodedRawData
      .split('\n')
      .filter(line => !line.startsWith('%'))
      .filter(line => line.includes(':'))
      .forEach(line => {
        const lineParts = line
          .replace(/<+$/, '')
          .trim()
          .split(/:(?!\/\/)/)
          .filter(part => part.trim() !== '');

        if (lineParts.length > 1) {
          const key = camelCase(lineParts[0])
          const value = lineParts
            .splice(1)
            .join(':')
            .replace(/<+$/, '')
            .trim()

          if (key in result) {
            result[key] = `${result[key]} ${value}`;
            return
          }

          result[key] = value;
        }
      });

    return result;
  }
}

export { WhoisData }
