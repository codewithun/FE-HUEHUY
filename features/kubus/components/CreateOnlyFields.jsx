import React from 'react';
import ContentTypeSelector from './ContentTypeSelector';
import { CheckboxComponent } from '../../../components/base.components';

/**
 * Render-only-for-create fields: Jenis Konten + Kubus Informasi checkbox
 * Includes a tiny sync to force content_type = 'kubus-informasi' when checked
 * and revert to 'promo' when unchecked.
 *
 * Contract
 * - props: { values, setValues, formSessionKey }
 * - returns JSX or null
 */
export default function CreateOnlyFields({ values, setValues, formSessionKey }) {
  if (!Array.isArray(values)) return null;

  const isChecked = !!values.find(i => i.name === 'is_information')?.value?.at?.(0);
  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';

  // Ensure sync between is_information and content_type
  if (isChecked && ct !== 'kubus-informasi') {
    const idx = values.findIndex(i => i.name === 'content_type');
    const newValues = [...values];
    if (idx >= 0) newValues[idx] = { ...newValues[idx], value: 'kubus-informasi' };
    else newValues.push({ name: 'content_type', value: 'kubus-informasi' });
    setValues(newValues);
  }
  if (!isChecked && ct === 'kubus-informasi') {
    const idx = values.findIndex(i => i.name === 'content_type');
    const newValues = [...values];
    if (idx >= 0) newValues[idx] = { ...newValues[idx], value: 'promo' };
    else newValues.push({ name: 'content_type', value: 'promo' });
    setValues(newValues);
  }

  return (
    <>
      <div key={`content-type-${formSessionKey}`}>
        <ContentTypeSelector values={values} setValues={setValues} />
      </div>
      <div key={`kubus-info-${formSessionKey}`}>
        <CheckboxComponent
          label="Kubus Informasi"
          name="is_information"
          checked={isChecked}
          onChange={() => {
            const nextVal = isChecked ? [] : [1];
            const idx = values.findIndex(i => i.name === 'is_information');
            const newValues = [...values];
            if (idx >= 0) newValues[idx] = { ...newValues[idx], value: nextVal };
            else newValues.push({ name: 'is_information', value: nextVal });
            setValues(newValues);
          }}
        />
      </div>
    </>
  );
}
