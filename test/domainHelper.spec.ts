import { expect } from 'chai';
import { DomainHelper } from '../src/helpers/DomainHelper';
import { ERRORS } from '../src/constants';

describe('DomainHelper', () => {
  let domainHelper: DomainHelper;

  beforeEach(() => {
    domainHelper = new DomainHelper();
  });

  describe('isFullyQualifiedDomainName', () => {
    it('should return true for a valid fully qualified domain name', () => {
      const result = domainHelper.isFullyQualifiedDomainName('www.example.com');
      expect(result).to.be.true;
    });

    it('should return false for an invalid fully qualified domain name', () => {
      const result = domainHelper.isFullyQualifiedDomainName('example');
      expect(result).to.be.false;
    });
  });

  describe('sanitize', () => {
    it('should sanitize and return the domain when it is valid', () => {
      const result = domainHelper.sanitize('https://www.example.com/');
      expect(result).to.equal('www.example.com');
    });

    it('should throw an error when the domain is empty', () => {
      expect(() => domainHelper.sanitize('')).to.throw(Error, ERRORS.NoDomainError);
    });

    it('should throw an error when the domain is not a fully qualified domain name', () => {
      expect(() => domainHelper.sanitize('example')).to.throw(Error, ERRORS.DomainParseError);
    });
  });
});
