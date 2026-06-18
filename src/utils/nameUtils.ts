export interface NameParts {
  firstName: string
  middleName: string
  lastName: string
}

export function splitFullName(fullName: string): NameParts {
  if (!fullName || typeof fullName !== "string") return { firstName: "", middleName: "", lastName: "" }
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const firstName = parts[0] || ""
  const lastName = parts.length > 1 ? parts[parts.length - 1] : ""
  const middleName = parts.length > 2 ? parts.slice(1, -1).join(" ") : ""
  return { firstName, middleName, lastName }
}

export interface NameFields {
  first_name?: string
  middle_name?: string
  last_name?: string
  full_name?: string
  email?: string
}

export function formatDisplayName({ first_name, middle_name, last_name, full_name, email }: NameFields): string {
  const firstName = first_name?.trim()
  const middleName = middle_name?.trim()
  const lastName = last_name?.trim()

  if (firstName || lastName) {
    return [firstName, middleName, lastName].filter(Boolean).join(" ").trim()
  }

  if (typeof full_name === "string" && full_name.trim()) {
    return full_name.trim()
  }

  if (typeof email === "string" && email.trim()) {
    return email.trim()
  }

  return "User"
}
