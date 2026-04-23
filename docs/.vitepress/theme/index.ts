import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "@fontsource/geist-mono/600.css";
import DefaultTheme from "vitepress/theme";
import "./custom.css";
import Layout from "./Layout.vue";
import SurfaceTile from "./components/SurfaceTile.vue";
import SurfaceMap from "./components/SurfaceMap.vue";
import TaperCurve from "./components/TaperCurve.vue";
import ApcaBadge from "./components/ApcaBadge.vue";
import Token from "./components/Token.vue";
import GradePreview from "./components/GradePreview.vue";
import BorderPreview from "./components/BorderPreview.vue";
import PreferencesPreview from "./components/PreferencesPreview.vue";
import PipelineDiagram from "./components/PipelineDiagram.vue";
import ShadowSurface from "./components/ShadowSurface.vue";
import LiveExample from "./components/LiveExample.vue";
import ValidityGrid from "./components/ValidityGrid.vue";
import PaletteGrid from "./components/PaletteGrid.vue";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("SurfaceTile", SurfaceTile);
    app.component("SurfaceMap", SurfaceMap);
    app.component("TaperCurve", TaperCurve);
    app.component("ApcaBadge", ApcaBadge);
    app.component("Token", Token);
    app.component("GradePreview", GradePreview);
    app.component("BorderPreview", BorderPreview);
    app.component("PreferencesPreview", PreferencesPreview);
    app.component("PipelineDiagram", PipelineDiagram);
    app.component("ShadowSurface", ShadowSurface);
    app.component("LiveExample", LiveExample);
    app.component("ValidityGrid", ValidityGrid);
    app.component("PaletteGrid", PaletteGrid);

    if (typeof window !== "undefined") {
      import("@design-axioms/color").then(({ registerColorSlider }) => {
        registerColorSlider();
      });
    }
  },
};
