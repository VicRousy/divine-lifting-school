export function splitFullName(fullName) {
  if (!fullName || typeof fullName !== "string") return { firstName: "", middleName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
  return { firstName, middleName, lastName };
}

export function formatDisplayName({ first_name, middle_name, last_name, full_name, email }) {
  const firstName = first_name?.trim();
  const middleName = middle_name?.trim();
  const lastName = last_name?.trim();

  if (firstName || lastName) {
    return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  }

  if (typeof full_name === "string" && full_name.trim()) {
    return full_name.trim();
  }

  if (typeof email === "string" && email.trim()) {
    return email.trim();
  }

  return "User";
}
