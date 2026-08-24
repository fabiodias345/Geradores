# Firmware HF-006Enet

Esqueleto PlatformIO para o gateway de telemetria dos geradores.

Escopo atual:

- ESP32 da HF-006Enet;
- modo somente leitura;
- diagnóstico pela USB/serial;
- nenhum comando de relé ou partida/parada;
- nenhum registrador Modbus definido sem o mapa oficial do DSE7320.

## Compilação e gravação

No PlatformIO:

```text
Build
Upload
Monitor
```

Porta atual identificada no Windows: `COM6`.
