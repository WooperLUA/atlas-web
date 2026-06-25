import {uState, uEffect} from '@atlas';
import {logger} from "@services";

type Rule<T, K extends keyof T> = (value: T[K], allValues: T) => string | null | undefined;
type Rules<T, K extends keyof T> = Rule<T, K> | Rule<T, K>[];

type FieldConfig<T, K extends keyof T> = {
    value: T[K];
    rules?: Rules<T, K>;
};

type FormDefinition<T> = { [K in keyof T]: FieldConfig<T, K> };

export interface UFormMeta<T>
{
    isDirty: boolean;
    isSubmitting: boolean;
    isValid: boolean;
    errors: Partial<Record<keyof T, string | null>>;
    validate: () => void;
}

export interface UFormInstance<T>
{
    values: T;
    onChange: (field: keyof T) => (e: Event) => void;
    meta: UFormMeta<T>;
    submit: (handler: (values: T) => Promise<void> | void) => Promise<void>;
    reset: () => void;
}

export function uForm<T extends Record<string, any>>(definition: FormDefinition<T>): UFormInstance<T>
{
    const initialValues = {} as T;
    const rulesMap = {} as Record<keyof T, Rule<T, any>[]>;

    for (const key in definition)
    {
        initialValues[key] = definition[key].value;
        const r = definition[key].rules;
        rulesMap[key] = r ? (Array.isArray(r) ? r : [r]) : [];
    }

    const values = uState<T>({...initialValues});
    const flags = uState({isDirty: false, isSubmitting: false, isValid: true});
    const errors = uState<Partial<Record<keyof T, string | null>>>({});

    for (const key in definition) (errors as any)[key] = null;

    uEffect(() =>
    {
        let hasErrors = false;
        for (const key in definition)
        {
            if ((errors as any)[key] != null)
            {
                hasErrors = true;
                break;
            }
        }
        flags.isValid = !hasErrors;
    });

    const validateField = (key: keyof T) =>
    {
        const fieldRules = rulesMap[key] || [];
        let errorMsg: string | null = null;

        for (const rule of fieldRules)
        {
            const err = rule(values[key], values);
            if (err)
            {
                errorMsg = err;
                break;
            }
        }
        (errors as any)[key] = errorMsg;
    };

    const validateAll = () =>
    {
        for (const key in rulesMap) validateField(key);

        let hasErrors = false;
        for (const key in definition)
        {
            if ((errors as any)[key] != null)
            {
                hasErrors = true;
                break;
            }
        }
        flags.isValid = !hasErrors;
    };

    const onChange = (field: keyof T) => (e: Event) =>
    {
        const target = e.target as HTMLInputElement;
        const val = target.type === 'checkbox' ? target.checked : target.value;
        (values as any)[field] = val;
        flags.isDirty = true;

        validateField(field);
    };

    const submit = async (handler: (values: T) => Promise<void> | void) =>
    {
        validateAll();

        if (!flags.isValid) return;

        flags.isSubmitting = true;
        try
        {
            await handler(values);
            flags.isDirty = false;
        }
        catch (err)
        {
            logger.error('Atlas-Form', 'Submission error : ', err)
        }
        finally
        {
            flags.isSubmitting = false;
        }
    };

    const reset = () =>
    {
        for (const key in initialValues) (values as any)[key] = initialValues[key];
        for (const key in errors) (errors as any)[key] = null;
        flags.isDirty = false;
        flags.isSubmitting = false;
        flags.isValid = true;
    };

    const meta: UFormMeta<T> = {
        get isDirty()
        {
            return flags.isDirty;
        },
        set isDirty(v)
        {
            flags.isDirty = v;
        },

        get isSubmitting()
        {
            return flags.isSubmitting;
        },
        set isSubmitting(v)
        {
            flags.isSubmitting = v;
        },

        get isValid()
        {
            return flags.isValid;
        },
        set isValid(v)
        {
            flags.isValid = v;
        },

        errors,
        validate: validateAll
    };

    return {values, onChange, meta, submit, reset};
}