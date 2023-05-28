import {ERRORS} from "../constants";

class DomainHelper {
  public isFullyQualifiedDomainName(domain: string): boolean {
    const parts = this.getUrl(domain).hostname.split(".");
    const topLevelDomain = parts[parts.length - 1];

    if (parts.length < 2) return false;

    if (!/^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i.test(topLevelDomain)) {
      return false;
    }

    if (/\s/.test(topLevelDomain)) {
      return false;
    }

    if (/^\d+$/.test(topLevelDomain)) {
      return false;
    }

    return parts.every((part) => {
      if (part.length > 63) {
        return false;
      }

      if (!/^[a-z_\u00a1-\uffff0-9-]+$/i.test(part)) {
        return false;
      }

      if (/[\uff01-\uff5e]/.test(part)) {
        return false;
      }

      if (/^-|-$/.test(part)) {
        return false;
      }

      if (/_/.test(part)) {
        return false;
      }

      return true;
    });
  };

  protected getUrl(domain: string): URL {
    const indexOfDoubleSlash = domain.indexOf('//')

    if (indexOfDoubleSlash > -1) {
      return new URL(domain)
    }

    return new URL(`https://${domain}`)
  };

  public sanitize(domain: string): string {
    let sanitized = domain.trim()

    if (sanitized === '') {
      throw new Error(ERRORS.NoDomainError)
    }

    if (!this.isFullyQualifiedDomainName(sanitized)) {
      throw new Error(ERRORS.DomainParseError)
    }

    sanitized = this.getUrl(sanitized).hostname

    return sanitized
  };
}

export { DomainHelper }
