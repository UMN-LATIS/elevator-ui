export const submitHiddenForm = ({
  action,
  method,
  inputs = {},
}: {
  action: string;
  method: string;
  inputs: Record<string, string>;
}) => {
  const form = document.createElement("form");
  form.action = action;
  form.method = method;
  form.style.display = "none";

  Object.entries(inputs).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  form.submit();
};
