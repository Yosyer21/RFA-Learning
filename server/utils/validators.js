const { z } = require('zod');

const booleanFromInput = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const usernameSchema = z
  .string()
  .trim()
  .min(1, 'Usuario requerido')
  .max(50)
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'La contraseÃ±a debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayÃºscula')
  .regex(/[a-z]/, 'Debe contener al menos una minÃºscula')
  .regex(/[0-9]/, 'Debe contener al menos un nÃºmero');

const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'ContraseÃ±a requerida'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'ContraseÃ±a actual requerida'),
  newPassword: passwordSchema,
});

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  username: z.string().trim().min(3, 'El usuario debe tener al menos 3 caracteres').max(50).transform((value) => value.toLowerCase()),
  password: passwordSchema,
});

const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  username: usernameSchema,
  password: passwordSchema,
  role: z.enum(['admin', 'student']).optional().default('student'),
  active: booleanFromInput.optional().default(true),
  mustChangePassword: booleanFromInput.optional().default(false),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  username: z.string().trim().min(1).max(50).transform((value) => value.toLowerCase()).optional(),
  password: z.union([passwordSchema, z.literal('')]).optional(),
  role: z.enum(['admin', 'student']).optional(),
  active: booleanFromInput.optional(),
  mustChangePassword: booleanFromInput.optional(),
});

const classContentSchema = z.object({
  spanish: z.string().trim().min(1, 'TÃ©rmino en espaÃ±ol requerido').max(200),
  english: z.string().trim().min(1, 'TÃ©rmino en inglÃ©s requerido').max(200),
});

const createClassSchema = z.object({
  title: z.string().trim().min(1, 'TÃ­tulo requerido').max(200),
  category: z.string().max(100).trim().optional().default('Vocabulary'),
  level: z.string().max(50).trim().optional().default('Beginner'),
  content: z.union([
    z.array(classContentSchema).min(1, 'El contenido de la clase no puede estar vacío'),
    z.string().min(1, 'El contenido de la clase no puede estar vacío'),
  ]),
});

const updateClassSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: z.string().max(100).trim().optional(),
  level: z.string().max(50).trim().optional(),
  content: z.union([
    z.array(classContentSchema).min(1, 'El contenido de la clase no puede estar vacío'),
    z.string().min(1, 'El contenido de la clase no puede estar vacío'),
  ]).optional(),
});

const progressSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  completedClasses: z.array(z.coerce.number().int().positive()).optional(),
  currentLevel: z.string().trim().min(1).optional(),
  score: z.coerce.number().int().min(0).optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
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
