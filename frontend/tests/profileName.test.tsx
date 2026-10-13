import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProfileDetails } from '../src/components/ProfileDetails';
import { validateRegistrationName } from '../src/lib/profileValidation';

describe('profile name handling', () => {
  it('rejects numeric-only and digit-containing registration names', () => {
    expect(validateRegistrationName('121')).toContain('cannot contain numbers');
    expect(validateRegistrationName('Alex2')).toContain('cannot contain numbers');
    expect(validateRegistrationName('Ada Lovelace')).toBe('');
  });

  it('renders the supplied stored name and email rather than an ID fallback', () => {
    const markup = renderToStaticMarkup(<ProfileDetails name="Ada Lovelace" email="ada@example.com" />);
    expect(markup).toContain('Ada Lovelace');
    expect(markup).toContain('ada@example.com');
    expect(markup).not.toContain('Engineer');
    expect(markup).not.toContain('Name containing numbers');
  });

  it('preserves a legacy numeric name and asks the user to have it updated', () => {
    const markup = renderToStaticMarkup(<ProfileDetails name="121" email="366@gmail.com" />);
    expect(markup).toContain('>121<');
    expect(markup).toContain('366@gmail.com');
    expect(markup).toContain('Please contact support to update your name');
  });
});
