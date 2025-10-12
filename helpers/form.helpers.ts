import { useState, useEffect } from 'react';
import { post, postProps } from './api.helpers';
import { validationHelper, validationRules } from './validation.helpers';

export const useForm = (
  submitControl: postProps,
  confirmation?: boolean,
  onSuccess?: (data: any) => void,
  onFailed?: (code: number) => void
) => {
  const [formRegisters, setFormRegisters] = useState<
    { name: string; validations?: validationRules }[]
  >([]);
  const [formValues, setFormValues] = useState<{ name: string; value?: any }[]>(
    []
  );
  const [formErrors, setFormErrors] = useState<{ name: string; error?: any }[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  useEffect(() => {
    setFormRegisters([]);
    setFormValues([]);
    setFormErrors([]);
  }, [submitControl?.path]);

  const onChange = (name: string, value?: any) => {
    setFormValues([
      ...formValues.filter((val) => val.name != name),
      { name, value: value != undefined ? value : '' },
    ]);
  };
  // console.log(formValues);

  const formControl = (name: string) => {
    return {
      onChange: (e: any) => onChange(name, e),
      value: formValues.find((val) => val.name == name)?.value || undefined,
      error: formErrors.find((val) => val.name == name)?.error || undefined,
      register: (regName: string, regValidations?: validationRules) => {
        if (!formRegisters.find((reg) => reg.name == regName)) {
          setFormRegisters([
            ...formRegisters.filter((reg) => reg.name != regName),
            { name: regName, validations: regValidations },
          ]);
        }
      },
      unregister: () => {
        setFormValues([...formValues.filter((val) => val.name != name)]);
        setFormRegisters([...formRegisters.filter((reg) => reg.name != name)]);
      },
    };
  };

  const fetch = async () => {
    setLoading(true);

    const formData = new FormData();

    formValues.map((val) => {
      const v = val.value;
      if (Array.isArray(v)) {
        // Append arrays with [] notation for backend (e.g., dynamic_content_cubes[])
        v.forEach((item) => formData.append(`${val.name}[]`, String(item)));
      } else if (v !== undefined && v !== null && typeof v === 'object') {
        // Serialize objects safely
        formData.append(val.name, JSON.stringify(v));
      } else {
        formData.append(val.name, v != undefined ? String(v) : '');
      }
    });

    const mutate = await post({
      url: submitControl.url,
      path: submitControl.path,
      bearer: submitControl.bearer,
      includeHeaders: submitControl.includeHeaders,
      contentType: submitControl.contentType,
      body: formData,
    });

    if (mutate?.status == 200 || mutate?.status == 201) {
      setLoading(false);
      onSuccess?.(mutate.data);
      setFormValues([]);
      setFormValues([]);
      setShowConfirm(false);
    } else if (mutate?.status == 422) {
      let errors: { name: string; error?: any }[] = [];

      if (typeof mutate.data == 'string') {
        let strRes = mutate.data;

        let sliced = strRes.slice(
          strRes.indexOf('{'),
          strRes.lastIndexOf('}') + 1
        );
        Object.keys(JSON.parse(sliced).errors).map((key) => {
          errors.push({
            name: key,
            error: JSON.parse(sliced).errors[key][0],
          });
        });
      } else {
        Object.keys(mutate.data.errors).map((key) => {
          errors.push({
            name: key,
            error: mutate.data.errors[key][0],
          });
        });
      }

      setFormErrors(errors);
      onFailed?.(mutate?.status || 500);
      setLoading(false);
      setShowConfirm(false);
    } else {
      onFailed?.(mutate?.status || 500);
      setShowConfirm(false);
      setLoading(false);
    }
  };

  const submit = async (e: any) => {
    e?.preventDefault();
    setFormErrors([]);

    const newErrors: { name: string; error?: any }[] = [];

    formRegisters.map((form) => {
      const { valid, message } = validationHelper({
        value: formValues.find((val) => val.name == form.name)?.value,
        rules: form.validations,
      });

      if (!valid) {
        newErrors.push({ name: form.name, error: message });
      }
    });

    if (newErrors.length) {
      setFormErrors(newErrors);
      return;
    }

    if (confirmation) {
      setShowConfirm(true);
    } else {
      fetch();
    }
  };

  const onConfirm = () => {
    fetch();
  };

  const setDefaultValues = (values: object) => {
    const newValues: { name: string; value?: any }[] = [];

    Object.keys(values).map((keyName: string) => {
      // if (formRegisters.find((form) => form.name == keyName)) {
      newValues.push({
        name: keyName,
        value: values[keyName as keyof object],
      });
      // }
    });
    setFormValues(newValues);
  };

  return [
    {
      formControl,
      values: formValues,
      setValues: setFormValues,
      errors: formErrors,
      setErrors: setFormErrors,
      setDefaultValues,
      registers: formRegisters,
      setRegisters: setFormRegisters,
      submit,
      loading,
      confirm: {
        show: showConfirm,
        onConfirm,
        onClose: () => setShowConfirm(false),
      },
    },
  ];
};
