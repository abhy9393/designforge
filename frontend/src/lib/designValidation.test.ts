import { describe, expect, it } from 'vitest';
import { getSubmissionValidationMessage, validateDraftDesign } from './designValidation';

describe('draft design validation', () => {
  it('rejects an empty design', () => {
    expect(validateDraftDesign({ classes: [] })).toBe('Please add at least one class before submitting your design.');
    expect(validateDraftDesign({
      classes: [{
        id: 'class-1',
        name: '   ',
        responsibilities: [''],
        attributes: [{ name: '', type: '' }],
        methods: [{ name: '', returnType: '', params: [{ name: '', type: '' }] }],
      }],
      relationships: [{ id: 'rel-1', source: '', target: '' }],
      notes: [''],
    })).toBe('Please enter a name for the first class.');
  });

  it('maps nested server validation paths to readable messages without exposing schema details', () => {
    const response = getSubmissionValidationMessage({
      response: {
        data: {
          message: 'design.classes[0].name: String must contain at least 1 character(s)',
          errors: [{
            field: 'design.classes[0].name',
            message: 'String must contain at least 1 character(s)',
          }],
        },
      },
    });
    expect(response).toBe('Please enter a name for the first class.');
    expect(response).not.toContain('design.classes');
    expect(response).not.toContain('String must');
  });

  it('uses a readable generic message for other design schema errors', () => {
    expect(getSubmissionValidationMessage({
      response: {
        data: {
          message: 'design.classes[0].attributes[0].name: String must contain at least 1 character(s)',
        },
      },
    })).toBe('Please review the required design fields and correct any missing or incomplete entries.');
  });

  it('rejects missing required fields but permits empty optional sections', () => {
    expect(validateDraftDesign({
      classes: [{
        id: 'class-1',
        name: 'ParkingLot',
        attributes: [{ name: 'capacity', type: '' }],
        methods: [],
      }],
      interfaces: [],
      relationships: [],
      notes: [],
    })).toBe('Class 1, attribute 1: Name and type are both required.');
  });

  it('accepts a complete draft with optional sections empty', () => {
    expect(validateDraftDesign({
      classes: [{
        id: 'class-1',
        name: 'ParkingLot',
        attributes: [],
        methods: [],
      }],
      interfaces: [],
      relationships: [],
      notes: [],
    })).toBeNull();
  });
});
