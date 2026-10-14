type DraftDesign = {
  classes?: Array<{
    id?: string;
    name?: string;
    responsibilities?: string[];
    attributes?: Array<{ name?: string; type?: string }>;
    methods?: Array<{
      name?: string;
      returnType?: string;
      params?: Array<{ name?: string; type?: string }>;
    }>;
  }>;
  interfaces?: Array<{ id?: string; name?: string; methods?: string[] }>;
  relationships?: Array<{ id?: string; source?: string; target?: string }>;
  notes?: string[];
};

function hasValue(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function classOrdinal(index: number): string {
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
  return ordinals[index] ?? `#${index + 1}`;
}

export function validateDraftDesign(design: DraftDesign): string | null {
  if (!Array.isArray(design.classes) || design.classes.length === 0) {
    return 'Please add at least one class before submitting your design.';
  }

  for (const [classIndex, designClass] of design.classes.entries()) {
    const classLabel = `Class ${classIndex + 1}`;
    if (!hasValue(designClass.id)) return `${classLabel}: Class identifier is missing.`;
    if (!hasValue(designClass.name)) return `Please enter a name for the ${classOrdinal(classIndex)} class.`;
    for (const [attributeIndex, attribute] of (designClass.attributes ?? []).entries()) {
      const nameIsSet = hasValue(attribute.name);
      const typeIsSet = hasValue(attribute.type);
      if (nameIsSet !== typeIsSet) {
        return `${classLabel}, attribute ${attributeIndex + 1}: Name and type are both required.`;
      }
    }
    for (const [methodIndex, method] of (designClass.methods ?? []).entries()) {
      const methodLabel = `${classLabel}, method ${methodIndex + 1}`;
      const nameIsSet = hasValue(method.name);
      const returnTypeIsSet = hasValue(method.returnType);
      const hasParameter = (method.params ?? []).some((parameter) =>
        hasValue(parameter.name) || hasValue(parameter.type),
      );
      if (nameIsSet !== returnTypeIsSet) return `${methodLabel}: Name and return type are both required.`;
      if (hasParameter && !nameIsSet) return `${methodLabel}: Name and return type are required when parameters are provided.`;
      for (const [parameterIndex, parameter] of (method.params ?? []).entries()) {
        const parameterNameIsSet = hasValue(parameter.name);
        const parameterTypeIsSet = hasValue(parameter.type);
        if (parameterNameIsSet !== parameterTypeIsSet) {
          return `${methodLabel}, parameter ${parameterIndex + 1}: Name and type are both required.`;
        }
      }
    }
  }

  for (const [interfaceIndex, designInterface] of (design.interfaces ?? []).entries()) {
    if (!hasValue(designInterface.id)) return `Interface ${interfaceIndex + 1}: Identifier is missing.`;
    if (!hasValue(designInterface.name)) return `Interface ${interfaceIndex + 1}: Name is required.`;
    for (const [methodIndex, method] of (designInterface.methods ?? []).entries()) {
      if (!hasValue(method)) return `Interface ${interfaceIndex + 1}, method ${methodIndex + 1}: Name is required.`;
    }
  }

  for (const [relationshipIndex, relationship] of (design.relationships ?? []).entries()) {
    if (!hasValue(relationship.id)) return `Relationship ${relationshipIndex + 1}: Identifier is missing.`;
    if (hasValue(relationship.source) !== hasValue(relationship.target)) {
      return `Relationship ${relationshipIndex + 1}: Both source and target are required.`;
    }
  }

  return null;
}

export function getSubmissionValidationMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) return null;
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) return null;
  const data = response.data;
  if (typeof data !== 'object' || data === null) return null;

  const message = 'message' in data && typeof data.message === 'string' ? data.message : '';
  if (message.includes('At least one class is required')) {
    return 'Please add at least one class before submitting your design.';
  }

  const field = 'errors' in data && Array.isArray(data.errors)
    ? data.errors.find((issue: unknown) =>
      typeof issue === 'object' && issue !== null && 'field' in issue && typeof issue.field === 'string',
    )?.field
    : message.split(':', 1)[0];
  if (typeof field !== 'string' || !/^design(?:\.|$)/.test(field)) return null;

  const classNameMatch = /^design\.classes\[(\d+)\]\.name$/.exec(field);
  if (classNameMatch) {
    return `Please enter a name for the ${classOrdinal(Number(classNameMatch[1]))} class.`;
  }
  if (field === 'design.classes') return 'Please add at least one class before submitting your design.';
  return 'Please review the required design fields and correct any missing or incomplete entries.';
}
