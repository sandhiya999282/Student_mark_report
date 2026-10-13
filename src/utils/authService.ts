import { AuthUser, LoginCredentials, RegisterData } from "../types";

const CURRENT_USER_KEY = "academic_analyzer_current_user";
const ALL_USERS_KEY = "academic_analyzer_registered_users";

// Pre-seeded verified institutional accounts for instant access and testing
const INITIAL_DEMO_USERS: AuthUser[] = [
  {
    id: "usr_admin_01",
    name: "Dr. A. Ramesh",
    email: "admin@campus.edu",
    role: "Dean / Administrator",
    department: "Academic Deanery & Administration",
    staffId: "ADM-2024-001",
    password: "Admin@123",
    avatarBg: "from-blue-600 to-indigo-700",
    registeredAt: "2024-01-10T08:00:00.000Z",
  },
  {
    id: "usr_faculty_02",
    name: "Prof. S. Priya",
    email: "faculty@campus.edu",
    role: "Faculty / Professor",
    department: "Computer Science & Engineering",
    staffId: "FAC-2025-104",
    password: "Faculty@123",
    avatarBg: "from-emerald-600 to-teal-700",
    registeredAt: "2025-02-14T09:30:00.000Z",
  },
  {
    id: "usr_exam_03",
    name: "K. Venkatesh",
    email: "examcell@campus.edu",
    role: "Examination Controller",
    department: "Controller of Examinations (CoE)",
    staffId: "COE-2023-018",
    password: "Exam@123",
    avatarBg: "from-amber-600 to-orange-700",
    registeredAt: "2023-08-01T10:15:00.000Z",
  },
  {
    id: "usr_faculty_sandhiya",
    name: "Prof. Sandhiya G",
    email: "sandhiya.g567@gmail.com",
    role: "Faculty / Professor",
    department: "Information Technology & Academic Analytics",
    staffId: "FAC-IT-2026",
    password: "Password@123",
    avatarBg: "from-purple-600 to-indigo-700",
    registeredAt: "2026-01-15T09:00:00.000Z",
  },
];

/**
 * Returns all registered users from localStorage or default seed list
 */
export function getAllUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(ALL_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure standard demo accounts including sandhiya are present
        const existingEmails = new Set(parsed.map((u: AuthUser) => u.email.toLowerCase()));
        let changed = false;
        for (const demo of INITIAL_DEMO_USERS) {
          if (!existingEmails.has(demo.email.toLowerCase())) {
            parsed.push(demo);
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(ALL_USERS_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // Seed default demo accounts
  try {
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(INITIAL_DEMO_USERS));
  } catch {
    // ignore
  }
  return INITIAL_DEMO_USERS;
}

/**
 * Saves updated users list
 */
function saveUsers(users: AuthUser[]): void {
  try {
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

/**
 * Get current logged in user from session storage / local storage
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw) as AuthUser;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Set current logged in user
 */
export function setCurrentUser(user: AuthUser | null, remember: boolean = true): void {
  try {
    if (user) {
      // Don't persist raw password in current session object
      const safeUser = { ...user };
      delete safeUser.password;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Log in with email and password
 */
export function loginUser(credentials: LoginCredentials): {
  success: boolean;
  user?: AuthUser;
  error?: string;
} {
  const emailClean = credentials.email.trim().toLowerCase();
  const passClean = credentials.password.trim();

  if (!emailClean) {
    return { success: false, error: "Please enter your email address or staff ID." };
  }
  if (!passClean) {
    return { success: false, error: "Please enter your password." };
  }

  const users = getAllUsers();
  const found = users.find(
    (u) =>
      u.email.toLowerCase() === emailClean ||
      u.staffId.toLowerCase() === emailClean
  );

  if (!found) {
    return {
      success: false,
      error: "No account found matching this email or Staff ID. Please register first or use a demo account.",
    };
  }

  if (found.password && found.password !== passClean) {
    return {
      success: false,
      error: "Incorrect password. Please verify and try again.",
    };
  }

  // Success
  setCurrentUser(found, credentials.rememberMe);
  return { success: true, user: found };
}

/**
 * Register a new user
 */
export function registerUser(data: RegisterData): {
  success: boolean;
  user?: AuthUser;
  error?: string;
} {
  const nameClean = data.name.trim();
  const emailClean = data.email.trim().toLowerCase();
  const passClean = data.password.trim();
  const staffIdClean = data.staffId.trim();

  if (!nameClean) {
    return { success: false, error: "Please enter your full name." };
  }
  if (!emailClean || !emailClean.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!staffIdClean) {
    return { success: false, error: "Please enter your Staff or Employee ID." };
  }
  if (!passClean || passClean.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long.",
    };
  }
  if (data.password !== data.confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === emailClean);
  if (existing) {
    return {
      success: false,
      error: "An account with this email address already exists. Please sign in instead.",
    };
  }

  const existingStaffId = users.find(
    (u) => u.staffId.toLowerCase() === staffIdClean.toLowerCase()
  );
  if (existingStaffId) {
    return {
      success: false,
      error: "An account with this Staff ID already exists. Please sign in instead.",
    };
  }

  const colorOptions = [
    "from-indigo-600 to-purple-700",
    "from-teal-600 to-emerald-700",
    "from-blue-600 to-cyan-700",
    "from-rose-600 to-pink-700",
    "from-amber-600 to-orange-700",
    "from-violet-600 to-fuchsia-700",
  ];
  const randomBg = colorOptions[Math.floor(Math.random() * colorOptions.length)];

  const newUser: AuthUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: nameClean,
    email: emailClean,
    role: data.role,
    department: data.department || "General Academics",
    staffId: staffIdClean,
    password: passClean,
    avatarBg: randomBg,
    registeredAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  setCurrentUser(newUser, true);

  return { success: true, user: newUser };
}

/**
 * Log out
 */
export function logoutUser(): void {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get demo accounts for quick one-click fill
 */
export function getDemoAccounts() {
  return [
    {
      role: "Dean / Administrator",
      name: "Dr. A. Ramesh",
      email: "admin@campus.edu",
      password: "Admin@123",
      label: "Admin / Dean",
      department: "Administration",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      role: "Faculty / Professor",
      name: "Prof. S. Priya",
      email: "faculty@campus.edu",
      password: "Faculty@123",
      label: "Faculty",
      department: "Computer Science",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      role: "Examination Controller",
      name: "K. Venkatesh",
      email: "examcell@campus.edu",
      password: "Exam@123",
      label: "Exam Cell",
      department: "CoE Examination Cell",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      role: "Faculty / Professor",
      name: "Prof. Sandhiya G",
      email: "sandhiya.g567@gmail.com",
      password: "Password@123",
      label: "Prof. Sandhiya",
      department: "IT Analytics",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    },
  ];
}
