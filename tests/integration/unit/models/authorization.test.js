import authorization from "models/authorization.js";
import { InternalServerError } from "infra/errors.js";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("without unknown feature", () => {
      const createdUser = {
        features: [],
      };
      expect(() => {
        authorization.can(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user` and valid known `feature`", () => {
      const createdUser = {
        features: ["create:user"],
      };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".canAssignRole()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.canAssignRole();
      }).toThrow(InternalServerError);
    });

    test("admin can assign any role", () => {
      const admin = { role: "admin", features: [] };
      expect(authorization.canAssignRole(admin, "admin")).toBe(true);
      expect(authorization.canAssignRole(admin, "supervisor")).toBe(true);
      expect(authorization.canAssignRole(admin, "operador")).toBe(true);
    });

    test("non-admin is limited to operador|pending", () => {
      const supervisor = { role: "supervisor", features: [] };
      expect(authorization.canAssignRole(supervisor, "operador")).toBe(true);
      expect(authorization.canAssignRole(supervisor, "pending")).toBe(true);
      expect(authorization.canAssignRole(supervisor, "supervisor")).toBe(false);
      expect(authorization.canAssignRole(supervisor, "admin")).toBe(false);
    });

    test("feature-privileged non-admin cannot assign elevated role", () => {
      const operador = { role: "operador", features: ["update:user:others"] };
      expect(authorization.canAssignRole(operador, "admin")).toBe(false);
      expect(authorization.canAssignRole(operador, "operador")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("without unknown feature", () => {
      const createdUser = {
        features: [],
      };
      expect(() => {
        authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and invalid `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };
      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and valid `resource`", () => {
      const createdUser = {
        features: ["read:user"],
      };
      const resource = {
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        email: "resource@resource.com",
        password: "reource",
      };

      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );

      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });
    });
  });
});
