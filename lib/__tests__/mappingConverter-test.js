"use strict";

var _graphqlCompose = require("graphql-compose");

var _mappingConverter = require("../mappingConverter");

const mapping = {
  properties: {
    name: {
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      }
    },
    avatarUrl: {
      properties: {
        big: {
          type: 'text'
        },
        thumb: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
              ignore_above: 256
            }
          }
        }
      }
    },
    lastname: {
      type: 'text'
    },
    birthday: {
      type: 'date'
    },
    noIndex: {
      type: 'date',
      index: false
    }
  }
};
beforeEach(() => {
  _graphqlCompose.schemaComposer.clear();
});
describe('PropertiesConverter', () => {
  describe('convertToSourceTC(schemaComposer, )', () => {
    it('should throw error on empty mapping', () => {
      expect(() => {
        // $FlowFixMe
        (0, _mappingConverter.convertToSourceTC)(_graphqlCompose.schemaComposer);
      }).toThrowError('incorrect mapping');
    });
    it('should throw error on empty typeName', () => {
      expect(() => {
        // $FlowFixMe
        (0, _mappingConverter.convertToSourceTC)(_graphqlCompose.schemaComposer, mapping);
      }).toThrowError('empty name');
    });
    it('should return ObjectTypeComposer', () => {
      const tc = (0, _mappingConverter.convertToSourceTC)(_graphqlCompose.schemaComposer, mapping, 'TestMapping');
      expect(tc).toBeInstanceOf(_graphqlCompose.ObjectTypeComposer);
      expect(tc.getTypeName()).toBe('TestMapping');
      expect(tc.getFieldNames()).toEqual(expect.arrayContaining(['name', 'avatarUrl']));
    });
    it('should make singular and plural fields', () => {
      const tc1 = (0, _mappingConverter.convertToSourceTC)(_graphqlCompose.schemaComposer, mapping, 'TestMapping');
      const singular = tc1.getFieldTC('name');
      expect(singular.getTypeName()).toBe('String');
      const tc2 = (0, _mappingConverter.convertToSourceTC)(_graphqlCompose.schemaComposer, mapping, 'TestMapping', {
        pluralFields: ['name']
      });
      const plural = tc2.getField('name');
      expect(plural.type.getTypeName()).toEqual('[String]');
    });
  });
  describe('propertyToSourceGraphQLType(schemaComposer, )', () => {
    it('should throw error on wrong property config', () => {
      expect(() => {
        // $FlowFixMe
        (0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer);
      }).toThrowError('incorrect Elastic property config');
      expect(() => {
        (0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {});
      }).toThrowError('incorrect Elastic property config');
    });
    it('should return GraphQLJSON as fallback for unknown Elastic type', () => {
      expect((0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        type: 'strange'
      })).toEqual('JSON');
    });
    it('should return GraphQLInt for int types', () => {
      expect((0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        type: 'integer'
      })).toEqual('Int');
      expect((0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        type: 'long'
      })).toEqual('Int');
    });
    it('should return String for string types', () => {
      expect((0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        type: 'text'
      })).toEqual('String');
      expect((0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        type: 'keyword'
      })).toEqual('String');
    });
    it('should return Float for float types', () => {
      expect((0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        type: 'float'
      })).toEqual('Float');
      expect((0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        type: 'double'
      })).toEqual('Float');
    });
    it('should return Boolean for float types', () => {
      expect((0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        type: 'boolean'
      })).toEqual('Boolean');
    });
    it('should return GraphQLObjectType for object with subfields', () => {
      const tc = (0, _mappingConverter.propertyToSourceGraphQLType)(_graphqlCompose.schemaComposer, {
        properties: {
          big: {
            type: 'text'
          },
          thumb: {
            type: 'text'
          }
        }
      }, 'ComplexType');
      expect(tc).toBeInstanceOf(_graphqlCompose.ObjectTypeComposer);
      expect(tc.getTypeName()).toEqual('ComplexType');
      expect(tc.getFieldNames()).toEqual(expect.arrayContaining(['big', 'thumb']));
      expect(tc.getFieldTC('big').getTypeName()).toEqual('String');
    });
  });
  describe('inputPropertiesToGraphQLTypes()', () => {
    it('should throw error on incorrect prop', () => {
      expect(() => {
        (0, _mappingConverter.inputPropertiesToGraphQLTypes)({});
      }).toThrowError('incorrect Elastic property config');
    });
    it('should convert property to Scalar', () => {
      const fields = (0, _mappingConverter.inputPropertiesToGraphQLTypes)({
        type: 'text'
      }, 'lastname');
      expect(fields._all.lastname).toEqual('String');
      expect(fields.text.lastname).toEqual('String');
    });
    it('should accept mapping', () => {
      const fields = (0, _mappingConverter.inputPropertiesToGraphQLTypes)(mapping);
      expect(Object.keys(fields._all).length).toBeGreaterThan(2);
    });
    it('should convert nested fields', () => {
      const fields = (0, _mappingConverter.inputPropertiesToGraphQLTypes)({
        properties: {
          name: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256
              }
            }
          }
        }
      });
      expect(Object.keys(fields._all).length).toEqual(2);
      expect(Object.keys(fields._all)).toEqual(expect.arrayContaining(['name', 'name__keyword']));
      expect(Object.keys(fields.keyword)).toEqual(expect.arrayContaining(['name__keyword']));
      expect(Object.keys(fields.text)).toEqual(expect.arrayContaining(['name']));
    });
    it('should not return index:false fields', () => {
      const fields = (0, _mappingConverter.inputPropertiesToGraphQLTypes)({
        properties: {
          name: {
            type: 'text',
            index: false
          },
          date: {
            type: 'date'
          }
        }
      });
      expect(Object.keys(fields._all).length).toEqual(1);
      expect(Object.keys(fields._all)).toEqual(expect.arrayContaining(['date']));
      expect(Object.keys(fields.date).length).toEqual(1);
      expect(Object.keys(fields.date)).toEqual(expect.arrayContaining(['date']));
    });
  });
  describe('getSubFields()', () => {
    it('should return array of sub fields', () => {
      expect((0, _mappingConverter.getSubFields)('range', ['ok', 'range', 'range.min', 'range.max'])).toEqual(['min', 'max']);
    });
    it('should return array for empty/undefined list', () => {
      expect((0, _mappingConverter.getSubFields)('range', null)).toEqual([]);
      expect((0, _mappingConverter.getSubFields)('range')).toEqual([]);
    });
  });
  describe('issue #9', () => {
    const mapping9 = {
      properties: {
        $id: {
          type: 'long'
        },
        lastName: {
          type: 'string'
        },
        email: {
          type: 'string',
          analyzer: 'email_analyzer'
        },
        $passwordHash: {
          type: 'string',
          index: 'not_analyzed'
        }
      }
    };
    const tc9 = (0, _mappingConverter.convertToSourceTC)(_graphqlCompose.schemaComposer, mapping9, 'Type9');
    it('should replace unacceptable characters in GraphQL fieldnames', () => {
      expect(tc9).toBeInstanceOf(_graphqlCompose.ObjectTypeComposer);
      expect(tc9.getFieldNames()).toEqual(expect.arrayContaining(['_id', 'lastName', 'email', '_passwordHash']));
    });
    it('should work with graphql schema without errors', () => {
      _graphqlCompose.schemaComposer.Query.addFields({
        userES: tc9
      });

      expect(() => _graphqlCompose.schemaComposer.buildSchema()).not.toThrowError();
    });
    it('should use Elastic field names from source', async () => {
      _graphqlCompose.schemaComposer.Query.addFields({
        userES: tc9
      });

      const result = await _graphqlCompose.graphql.graphql(_graphqlCompose.schemaComposer.buildSchema(), `
          query {
            userES {
              _id
              lastName
              email
              _passwordHash
            }
          }
        `, {
        // simulate elastic responce
        userES: {
          $id: 123,
          lastName: 'Tyler',
          email: 'tyler@example.com',
          $passwordHash: 'abc1234def'
        }
      });
      expect(result).toEqual({
        data: {
          userES: {
            _id: 123,
            lastName: 'Tyler',
            email: 'tyler@example.com',
            _passwordHash: 'abc1234def'
          }
        }
      });
    });
  });
});