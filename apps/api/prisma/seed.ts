/**
 * Database seed — roles, permissions, demo users.
 * Run: pnpm --filter @smart-office/api prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ALL_PERMISSION_CODES,
  PERMISSION_META,
  ROLE_META,
  ROLE_PERMISSION_MAP,
  SystemRole,
} from '@smart-office/shared';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Admin@12345';

const DEMO_USERS: Array<{
  email: string;
  firstName: string;
  lastName: string;
  role: SystemRole;
  employeeCode?: string;
}> = [
  {
    email: 'superadmin@smartoffice.local',
    firstName: 'Super',
    lastName: 'Admin',
    role: SystemRole.SUPER_ADMIN,
    employeeCode: 'EMP-0001',
  },
  {
    email: 'admin@smartoffice.local',
    firstName: 'System',
    lastName: 'Admin',
    role: SystemRole.ADMIN,
    employeeCode: 'EMP-0002',
  },
  {
    email: 'hr@smartoffice.local',
    firstName: 'Hana',
    lastName: 'HR',
    role: SystemRole.HR,
    employeeCode: 'EMP-0003',
  },
  {
    email: 'inventory@smartoffice.local',
    firstName: 'Omar',
    lastName: 'Inventory',
    role: SystemRole.INVENTORY_MANAGER,
    employeeCode: 'EMP-0004',
  },
  {
    email: 'barista@smartoffice.local',
    firstName: 'Layla',
    lastName: 'Barista',
    role: SystemRole.BARISTA,
    employeeCode: 'EMP-0005',
  },
  {
    email: 'gaming@smartoffice.local',
    firstName: 'Karim',
    lastName: 'Gaming',
    role: SystemRole.GAMING_SUPERVISOR,
    employeeCode: 'EMP-0006',
  },
  {
    email: 'employee@smartoffice.local',
    firstName: 'Sara',
    lastName: 'Employee',
    role: SystemRole.EMPLOYEE,
    employeeCode: 'EMP-0100',
  },
  {
    email: 'guest@smartoffice.local',
    firstName: 'Guest',
    lastName: 'User',
    role: SystemRole.GUEST,
  },
];

async function seedPermissions() {
  for (const code of ALL_PERMISSION_CODES) {
    const meta = PERMISSION_META[code];
    await prisma.permission.upsert({
      where: { code },
      create: {
        code,
        module: meta.module,
        nameEn: meta.nameEn,
        nameAr: meta.nameAr,
      },
      update: {
        module: meta.module,
        nameEn: meta.nameEn,
        nameAr: meta.nameAr,
      },
    });
  }
  console.log(`✓ ${ALL_PERMISSION_CODES.length} permissions`);
}

async function seedRoles() {
  const allPermissions = await prisma.permission.findMany();
  const permissionByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  for (const roleCode of Object.values(SystemRole)) {
    const meta = ROLE_META[roleCode];
    const role = await prisma.role.upsert({
      where: { code: roleCode },
      create: {
        code: roleCode,
        nameEn: meta.nameEn,
        nameAr: meta.nameAr,
        description: meta.description,
        isSystem: true,
      },
      update: {
        nameEn: meta.nameEn,
        nameAr: meta.nameAr,
        description: meta.description,
        isSystem: true,
      },
    });

    const mapping = ROLE_PERMISSION_MAP[roleCode];
    const codes =
      mapping === '*' ? ALL_PERMISSION_CODES : mapping;

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: codes
        .map((code) => permissionByCode.get(code))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
  console.log(`✓ ${Object.values(SystemRole).length} roles + permission matrix`);
}

async function seedDepartment() {
  return prisma.department.upsert({
    where: { code: 'HQ' },
    create: {
      code: 'HQ',
      nameEn: 'Headquarters',
      nameAr: 'المقر الرئيسي',
    },
    update: {},
  });
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const department = await seedDepartment();

  for (const demo of DEMO_USERS) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { code: demo.role },
    });

    const user = await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        email: demo.email,
        passwordHash,
        firstName: demo.firstName,
        lastName: demo.lastName,
        locale: 'en',
        status: 'ACTIVE',
        roles: { create: [{ roleId: role.id }] },
        rewardAccount: { create: { points: 100 } },
        freeDrinkBalance: { create: { balance: 5 } },
        ...(demo.employeeCode
          ? {
              employeeProfile: {
                create: {
                  employeeCode: demo.employeeCode,
                  departmentId: department.id,
                  jobTitle: demo.role.replaceAll('_', ' '),
                },
              },
            }
          : {}),
      },
      update: {
        passwordHash,
        firstName: demo.firstName,
        lastName: demo.lastName,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    // Ensure role assignment on re-seed
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }
  console.log(`✓ ${DEMO_USERS.length} demo users (password: ${DEMO_PASSWORD})`);
}

async function seedSettings() {
  const defaults: Array<{ key: string; group: string; value: object }> = [
    {
      key: 'orders.inventory_deduct_on',
      group: 'orders',
      value: { status: 'PREPARING' },
    },
    {
      key: 'cafe.name',
      group: 'general',
      value: { en: 'Smart Office Café', ar: 'مقهى المكتب الذكي' },
    },
    {
      key: 'locale.default',
      group: 'general',
      value: { locale: 'en' },
    },
    {
      key: 'rewards.points_per_order',
      group: 'rewards',
      value: { value: 10 },
    },
    {
      key: 'rewards.points_per_rating',
      group: 'rewards',
      value: { value: 5 },
    },
    {
      key: 'rewards.points_per_free_drink',
      group: 'rewards',
      value: { value: 50 },
    },
  ];

  for (const setting of defaults) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: { value: setting.value, group: setting.group },
    });
  }
  console.log(`✓ ${defaults.length} app settings`);
}

async function seedCatalog() {
  const ingredients = [
    {
      sku: 'MILK-WHL',
      nameEn: 'Whole Milk',
      nameAr: 'حليب كامل',
      unit: 'ML' as const,
      reorderLevel: 5000,
      stockQty: 20000,
      expiresInDays: 4,
      expiryTrack: true,
    },
    {
      sku: 'COFFEE-ESP',
      nameEn: 'Espresso Beans',
      nameAr: 'حبوب إسبريسو',
      unit: 'G' as const,
      reorderLevel: 1000,
      stockQty: 8000,
    },
    {
      sku: 'SUGAR-WHT',
      nameEn: 'White Sugar',
      nameAr: 'سكر أبيض',
      unit: 'G' as const,
      reorderLevel: 2000,
      stockQty: 10000,
    },
    {
      sku: 'WATER',
      nameEn: 'Water',
      nameAr: 'ماء',
      unit: 'ML' as const,
      reorderLevel: 0,
      stockQty: 100000,
    },
    {
      sku: 'CHOC-SYR',
      nameEn: 'Chocolate Syrup',
      nameAr: 'شراب شوكولاتة',
      unit: 'ML' as const,
      reorderLevel: 500,
      stockQty: 400,
      expiresInDays: 12,
      expiryTrack: true,
    },
  ];

  const ingredientIds: Record<string, string> = {};
  for (const ing of ingredients) {
    const expiresAt =
      'expiresInDays' in ing && ing.expiresInDays
        ? new Date(Date.now() + ing.expiresInDays * 86400000)
        : null;

    const row = await prisma.ingredient.upsert({
      where: { sku: ing.sku },
      create: {
        sku: ing.sku,
        nameEn: ing.nameEn,
        nameAr: ing.nameAr,
        unit: ing.unit,
        reorderLevel: ing.reorderLevel,
        expiryTrack: 'expiryTrack' in ing ? Boolean(ing.expiryTrack) : false,
        stockItem: {
          create: {
            type: 'INGREDIENT',
            quantity: ing.stockQty,
            expiresAt,
          },
        },
      },
      update: {
        nameEn: ing.nameEn,
        nameAr: ing.nameAr,
        unit: ing.unit,
        reorderLevel: ing.reorderLevel,
        expiryTrack: 'expiryTrack' in ing ? Boolean(ing.expiryTrack) : false,
        deletedAt: null,
      },
      include: { stockItem: true },
    });

    if (row.stockItem) {
      await prisma.stockItem.update({
        where: { id: row.stockItem.id },
        data: { quantity: ing.stockQty, expiresAt },
      });
    } else {
      await prisma.stockItem.create({
        data: {
          type: 'INGREDIENT',
          ingredientId: row.id,
          quantity: ing.stockQty,
          expiresAt,
        },
      });
    }
    ingredientIds[ing.sku] = row.id;
  }

  const categories = [
    {
      slug: 'hot-drinks',
      nameEn: 'Hot Drinks',
      nameAr: 'مشروبات ساخنة',
      sortOrder: 1,
    },
    {
      slug: 'cold-drinks',
      nameEn: 'Cold Drinks',
      nameAr: 'مشروبات باردة',
      sortOrder: 2,
    },
    {
      slug: 'snacks',
      nameEn: 'Snacks',
      nameAr: 'وجبات خفيفة',
      sortOrder: 3,
    },
  ];

  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { ...cat, isActive: true },
      update: { ...cat, isActive: true, deletedAt: null },
    });
    categoryIds[cat.slug] = row.id;
  }

  const menuItems = [
    {
      sku: 'LATTE-001',
      slug: 'latte',
      nameEn: 'Latte',
      nameAr: 'لاتيه',
      descriptionEn: 'Espresso with steamed milk',
      descriptionAr: 'إسبريسو مع حليب مبخر',
      price: 14,
      category: 'hot-drinks',
      prepTimeMin: 5,
      calories: 180,
      isFeatured: true,
      recipe: {
        name: 'Latte Recipe',
        lines: [
          { sku: 'MILK-WHL', quantity: 250, unit: 'ML' as const },
          { sku: 'COFFEE-ESP', quantity: 18, unit: 'G' as const },
          { sku: 'SUGAR-WHT', quantity: 5, unit: 'G' as const },
        ],
      },
    },
    {
      sku: 'ESP-001',
      slug: 'espresso',
      nameEn: 'Espresso',
      nameAr: 'إسبريسو',
      descriptionEn: 'Double shot espresso',
      descriptionAr: 'إسبريسو دبل شوت',
      price: 10,
      category: 'hot-drinks',
      prepTimeMin: 3,
      calories: 5,
      isFeatured: false,
      recipe: {
        name: 'Espresso Recipe',
        lines: [{ sku: 'COFFEE-ESP', quantity: 18, unit: 'G' as const }],
      },
    },
    {
      sku: 'AMER-001',
      slug: 'americano',
      nameEn: 'Americano',
      nameAr: 'أمريكانو',
      descriptionEn: 'Espresso with hot water',
      descriptionAr: 'إسبريسو مع ماء ساخن',
      price: 12,
      category: 'hot-drinks',
      prepTimeMin: 4,
      calories: 10,
      isFeatured: false,
      recipe: {
        name: 'Americano Recipe',
        lines: [
          { sku: 'COFFEE-ESP', quantity: 18, unit: 'G' as const },
          { sku: 'WATER', quantity: 200, unit: 'ML' as const },
        ],
      },
    },
    {
      sku: 'MOCHA-001',
      slug: 'iced-mocha',
      nameEn: 'Iced Mocha',
      nameAr: 'موكا مثلج',
      descriptionEn: 'Chocolate espresso over ice',
      descriptionAr: 'إسبريسو بالشوكولاتة على الثلج',
      price: 16,
      category: 'cold-drinks',
      prepTimeMin: 6,
      calories: 220,
      isFeatured: true,
      recipe: {
        name: 'Iced Mocha Recipe',
        lines: [
          { sku: 'MILK-WHL', quantity: 200, unit: 'ML' as const },
          { sku: 'COFFEE-ESP', quantity: 18, unit: 'G' as const },
          { sku: 'CHOC-SYR', quantity: 30, unit: 'ML' as const },
        ],
      },
    },
  ];

  for (const item of menuItems) {
    const menu = await prisma.menuItem.upsert({
      where: { sku: item.sku },
      create: {
        sku: item.sku,
        slug: item.slug,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        descriptionEn: item.descriptionEn,
        descriptionAr: item.descriptionAr,
        price: item.price,
        categoryId: categoryIds[item.category],
        prepTimeMin: item.prepTimeMin,
        calories: item.calories,
        isFeatured: item.isFeatured,
        isAvailable: true,
      },
      update: {
        slug: item.slug,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        descriptionEn: item.descriptionEn,
        descriptionAr: item.descriptionAr,
        price: item.price,
        categoryId: categoryIds[item.category],
        prepTimeMin: item.prepTimeMin,
        calories: item.calories,
        isFeatured: item.isFeatured,
        isAvailable: true,
        deletedAt: null,
      },
    });

    const existingRecipe = await prisma.recipe.findUnique({
      where: { menuItemId: menu.id },
    });

    if (existingRecipe) {
      await prisma.recipeLine.deleteMany({
        where: { recipeId: existingRecipe.id },
      });
      await prisma.recipe.update({
        where: { id: existingRecipe.id },
        data: {
          name: item.recipe.name,
          isActive: true,
          version: existingRecipe.version + 1,
          deletedAt: null,
          lines: {
            create: item.recipe.lines.map((l) => ({
              ingredientId: ingredientIds[l.sku],
              quantity: l.quantity,
              unit: l.unit,
            })),
          },
        },
      });
    } else {
      await prisma.recipe.create({
        data: {
          menuItemId: menu.id,
          name: item.recipe.name,
          isActive: true,
          lines: {
            create: item.recipe.lines.map((l) => ({
              ingredientId: ingredientIds[l.sku],
              quantity: l.quantity,
              unit: l.unit,
            })),
          },
        },
      });
    }
  }

  console.log(
    `✓ catalog: ${ingredients.length} ingredients, ${categories.length} categories, ${menuItems.length} menu items + recipes`,
  );
}

async function seedProcurement() {
  const supplier = await prisma.supplier.upsert({
    where: { code: 'SUP-DAIRY' },
    create: {
      code: 'SUP-DAIRY',
      name: 'Fresh Dairy Co.',
      contactName: 'Nour Hassan',
      email: 'orders@freshdairy.example',
      phone: '+966500000001',
      address: 'Riyadh Industrial Zone',
      isActive: true,
    },
    update: {
      name: 'Fresh Dairy Co.',
      isActive: true,
      deletedAt: null,
    },
  });

  await prisma.supplier.upsert({
    where: { code: 'SUP-COFFEE' },
    create: {
      code: 'SUP-COFFEE',
      name: 'Arabica Beans Trading',
      contactName: 'Yousef Ali',
      email: 'sales@arabica.example',
      phone: '+966500000002',
      isActive: true,
    },
    update: { isActive: true, deletedAt: null },
  });

  const milk = await prisma.ingredient.findUnique({ where: { sku: 'MILK-WHL' } });
  if (milk) {
    const existingPo = await prisma.purchaseOrder.findFirst({
      where: { number: { startsWith: 'PO-SEED' } },
    });
    if (!existingPo) {
      await prisma.purchaseOrder.create({
        data: {
          number: 'PO-SEED-001',
          supplierId: supplier.id,
          status: 'SUBMITTED',
          orderedAt: new Date(),
          expectedAt: new Date(Date.now() + 2 * 86400000),
          notes: 'Seed purchase order — receive from Inventory UI',
          lines: {
            create: [
              {
                ingredientId: milk.id,
                quantity: 20000,
                unit: 'ML',
                unitCost: 0.004,
              },
            ],
          },
        },
      });
    }
  }

  console.log('✓ procurement: 2 suppliers + sample PO');
}

async function seedGaming() {
  const ps5 = await prisma.gamingRoom.upsert({
    where: { code: 'ROOM-PS5' },
    create: {
      code: 'ROOM-PS5',
      nameEn: 'PlayStation Lounge',
      nameAr: 'صالة بلاي ستيشن',
      capacity: 4,
      isActive: true,
    },
    update: { isActive: true, deletedAt: null },
  });

  const pc = await prisma.gamingRoom.upsert({
    where: { code: 'ROOM-PC' },
    create: {
      code: 'ROOM-PC',
      nameEn: 'PC Arena',
      nameAr: 'ساحة الحاسب',
      capacity: 6,
      isActive: true,
    },
    update: { isActive: true, deletedAt: null },
  });

  const devices = [
    { code: 'PS5-01', name: 'PlayStation 5 #1', type: 'CONSOLE', roomId: ps5.id },
    { code: 'PS5-02', name: 'PlayStation 5 #2', type: 'CONSOLE', roomId: ps5.id },
    { code: 'PC-01', name: 'Gaming PC #1', type: 'PC', roomId: pc.id },
    { code: 'PC-02', name: 'Gaming PC #2', type: 'PC', roomId: pc.id },
    { code: 'VR-01', name: 'VR Headset', type: 'VR', roomId: pc.id },
  ];

  for (const d of devices) {
    await prisma.gamingDevice.upsert({
      where: { code: d.code },
      create: {
        code: d.code,
        name: d.name,
        type: d.type,
        roomId: d.roomId,
        isActive: true,
      },
      update: {
        name: d.name,
        type: d.type,
        roomId: d.roomId,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  const employee = await prisma.user.findUnique({
    where: { email: 'employee@smartoffice.local' },
  });

  if (employee) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow.getTime() + 60 * 60_000);

    const existing = await prisma.gamingBooking.findFirst({
      where: { number: { startsWith: 'GB-SEED' } },
    });
    if (!existing) {
      await prisma.gamingBooking.create({
        data: {
          number: 'GB-SEED-001',
          userId: employee.id,
          roomId: ps5.id,
          status: 'CONFIRMED',
          startAt: tomorrow,
          endAt: end,
          partySize: 2,
          notes: 'Seed booking — start from Gaming portal',
          qrCode: 'GB-SEED-001-qr',
        },
      });
    }
  }

  console.log('✓ gaming: 2 rooms, 5 devices, sample booking');
}

async function main() {
  console.log('Seeding Smart Office database...\n');
  await seedPermissions();
  await seedRoles();
  await seedUsers();
  await seedSettings();
  await seedCatalog();
  await seedProcurement();
  await seedGaming();
  console.log('\nSeed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
