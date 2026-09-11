import { describe, expect, it } from "vitest";

import {
  assertCanSend,
  assertChannelTransition,
  assertStageTransition,
  canAdvanceStage,
  canChangeChannel,
  isTerminalChannel,
  TransitionError,
} from "./transitions.ts";

describe("pipeline de clientes", () => {
  it("avanca um passo por vez", () => {
    expect(canAdvanceStage("customer", "discovered", "qualified")).toBe(true);
    expect(canAdvanceStage("customer", "qualified", "contacted")).toBe(true);
  });

  it("recusa pular etapas", () => {
    expect(canAdvanceStage("customer", "discovered", "active_customer")).toBe(false);
    expect(() => assertStageTransition("customer", "discovered", "registered")).toThrow(
      TransitionError,
    );
  });

  it("recusa voltar", () => {
    expect(canAdvanceStage("customer", "interested", "contacted")).toBe(false);
  });

  it("permite encerrar de qualquer etapa, e nada sai de closed", () => {
    expect(canAdvanceStage("customer", "replied", "closed")).toBe(true);
    expect(canAdvanceStage("customer", "closed", "discovered")).toBe(false);
  });

  it("nao aceita etapa de afiliado no funil de clientes", () => {
    // joined_affiliate_group nao existe no pipeline de clientes
    expect(canAdvanceStage("customer", "interested", "joined_affiliate_group")).toBe(false);
  });
});

describe("pipeline de afiliados", () => {
  it("vai ate gerou cliente", () => {
    expect(canAdvanceStage("affiliate", "interested", "joined_affiliate_group")).toBe(true);
    expect(canAdvanceStage("affiliate", "active_affiliate", "generated_customer")).toBe(true);
  });

  it("recusa a etapa de cliente", () => {
    expect(canAdvanceStage("affiliate", "interested", "whatsapp_handoff")).toBe(false);
  });
});

describe("maquina de canal", () => {
  it("primeiro contato so sai de inbound_pending", () => {
    expect(canChangeChannel("inbound_pending", "private_reply_sent")).toBe(true);
  });

  it("do_not_contact e absorvente — nunca reentra por outra campanha", () => {
    expect(isTerminalChannel("do_not_contact")).toBe(true);
    expect(canChangeChannel("do_not_contact", "api_eligible")).toBe(false);
    expect(canChangeChannel("do_not_contact", "inbound_pending")).toBe(false);
    expect(() => assertChannelTransition("do_not_contact", "api_active")).toThrow(TransitionError);
  });

  it("blocked tambem e absorvente", () => {
    expect(isTerminalChannel("blocked")).toBe(true);
  });

  it("janela fechada pode reabrir se o lead escrever de novo", () => {
    expect(canChangeChannel("api_window_closed", "api_eligible")).toBe(true);
  });
});

describe("trava de propriedade do canal (zero envio duplicado)", () => {
  it("inbound_pending so permite resposta privada", () => {
    expect(() => assertCanSend("inbound_pending", "private_reply")).not.toThrow();
    expect(() => assertCanSend("inbound_pending", "api_dm")).toThrow(TransitionError);
  });

  it("depois do handoff, a resposta privada nao envia mais", () => {
    expect(() => assertCanSend("api_active", "api_dm")).not.toThrow();
    expect(() => assertCanSend("api_active", "private_reply")).toThrow(TransitionError);
  });

  it("nenhum envio enquanto espera resposta", () => {
    expect(() => assertCanSend("waiting_inbound_reply", "private_reply")).toThrow(TransitionError);
    expect(() => assertCanSend("waiting_inbound_reply", "api_dm")).toThrow(TransitionError);
  });

  it("nenhum envio para quem pediu para parar", () => {
    expect(() => assertCanSend("do_not_contact", "api_dm")).toThrow(TransitionError);
    expect(() => assertCanSend("do_not_contact", "private_reply")).toThrow(TransitionError);
  });

  it("janela expirada nao envia", () => {
    expect(() => assertCanSend("api_window_closed", "api_dm")).toThrow(TransitionError);
  });
});
