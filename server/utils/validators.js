const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido').trim(),
  password: z.string().min(1, 'Contraseña requerida'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: passwordSchema,
});

const registerSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100).trim(),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(50).trim(),
  password: passwordSchema,
});

const createUserSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100).trim(),
  username: z.string().min(1, 'Usuario requerido').max(50).trim(),
  password: passwordSchema,
  role: z.enum(['admin', 'student']).optional().default('student'),
  active: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(false),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  username: z.string().min(1).max(50).trim().optional(),
  password: passwordSchema.optional().or(z.literal('')),
  role: z.enum(['admin', 'student']).optional(),
  active: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
});

const createClassSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(200).trim(),
  category: z.string().max(100).trim().optional().default('Vocabulary'),
  level: z.string().max(50).trim().optional().default('Beginner'),
  content: z.union([z.array(z.object({ spanish: z.string(), english: z.string() })), z.string()]),
});

const updateClassSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  category: z.string().max(100).trim().optional(),
  level: z.string().max(50).trim().optional(),
  content: z.union([z.array(z.object({ spanish: z.string(), english: z.string() })), z.string()]).optional(),
});

const progressSchema = z.object({
  userId: z.number().int().positive().optional(),
  completedClasses: z.array(z.number().int()).optional(),
  currentLevel: z.string().optional(),
  score: z.number().int().min(0).optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return res.status(400).json({ message: errors[0], errors });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  passwordSchema,
  loginSchema,
  changePasswordSchema,
  registerSchema,
  createUserSchema,
  updateUserSchema,
  createClassSchema,
  updateClassSchema,
  progressSchema,
  validate,
};
