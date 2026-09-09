import Input from './Input';

export default function DecimalInput({
  label,
  value,
  onChange,
  step = '0.001',
  ...props
}) {
  return (
    <Input
      label={label}
      type="number"
      min="0"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
}
