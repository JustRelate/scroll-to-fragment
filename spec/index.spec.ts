import { expect } from "@esm-bundle/chai";
import { scrollToFragment, stopScrollToFragment } from "../src/index";
import { createBrowserHistory } from "history";

describe("scrollToFragment", () => {
  beforeEach(async () => {
    document.body.innerHTML = "";
    document.body.insertAdjacentHTML(
      "beforeend",
      `<h1 style="height:200px">H1</h1>
      <p style="height:10000px">Lorem</p>
      <h2 style="height:200px" id="foobar">H2</h2>
      <p id="bottom10400" style="height:1000px">Ipsum</p>
      <a href="javascript://#top" id="other">Other page</a>
      <a href="index.html#bottom10400" id="same">Same page</a>
      <a href="#bottom10400" id="hashOnly">Hash only</a>
      <a href="#bottom10400"><span id="spanInA">Nested</span></a>
      `,
    );
    history.replaceState(null, "", "index.html");
    window.scrollTo(0, 333);
    await wait();
  });

  afterEach(() => stopScrollToFragment());

  describe("stopScrollToFragment", () => {
    let wasCalled: boolean;

    beforeEach(async () => {
      wasCalled = false;
      scrollToFragment({
        scrollIntoView: () => {
          wasCalled = true;
        },
      });
      stopScrollToFragment();
      document.getElementById("same")?.click();
      await wait();
    });

    it("no longer calls the callback", () => {
      expect(wasCalled).to.be.false;
    });
  });

  describe("with a URL hash", () => {
    beforeEach(async () => {
      location.hash = "foobar";
      scrollToFragment();
      await wait();
    });

    it("scrolls to the matching element", () => {
      expect(window.scrollY).to.be.closeTo(10400, 1000);
    });

    describe("clicking a link to a different page", () => {
      beforeEach(async () => {
        window.scrollTo(0, 444);
        document.getElementById("other")?.click();
        await wait();
      });

      it("keeps the scroll position unchanged", () => {
        expect(window.scrollY).to.be.closeTo(444, 10);
      });
    });

    describe("clicking a hash link to the same page", () => {
      beforeEach(async () => {
        window.scrollTo(0, 444);
        document.getElementById("same")?.click();
        await wait();
      });

      it("scrolls to the matching element", () => {
        expect(window.scrollY).to.be.closeTo(10400, 1000);
      });
    });

    describe("clicking a hash link with defaultPrevented", () => {
      const listener = (event: Event) => {
        const id = (event.target as Element).id;
        if (id === "same") event.preventDefault();
      };

      beforeEach(async () => {
        window.scrollTo(0, 444);
        document.addEventListener("click", listener);
        document.getElementById("same")?.click();
        await wait();
      });

      afterEach(() => document.removeEventListener("click", listener));

      it("keeps the scroll position unchanged", () => {
        expect(window.scrollY).to.be.closeTo(444, 10);
      });
    });
  });

  describe("with a URL hash but no matching fragment", () => {
    beforeEach(async () => {
      history.replaceState(null, "", "index.html#barbaz");
      scrollToFragment();
      await wait();
    });

    it("keeps the scroll position unchanged", () => {
      expect(window.scrollY).to.be.closeTo(333, 10);
    });

    describe("if the fragment appears later", () => {
      beforeEach(async () => {
        document
          .getElementById("bottom10400")
          ?.insertAdjacentHTML("beforebegin", "<h1 id='barbaz'>H1</h1>");
        await wait();
      });

      it("scrolls to the matching element", () => {
        expect(window.scrollY).to.be.closeTo(10400, 1000);
      });
    });
  });

  describe("clicking an element wrapped by a hash link", () => {
    beforeEach(async () => {
      scrollToFragment({ scrollIntoView: () => window.scrollTo(0, 123) });
      document.getElementById("spanInA")?.click();
      await wait();
    });

    it("scrolls, overriding the browser default", () => {
      expect(window.scrollY).to.be.closeTo(123, 10);
    });
  });

  describe("without a URL hash", () => {
    beforeEach(async () => {
      scrollToFragment();
      await wait();
    });

    it("keeps the scroll position unchanged", () => {
      expect(window.scrollY).to.be.closeTo(333, 10);
    });
  });

  describe("with scrollIntoView", () => {
    beforeEach(async () => {
      scrollToFragment({ scrollIntoView: () => window.scrollTo(0, 123) });
      document.getElementById("hashOnly")?.click();
      await wait();
    });

    it("scrolls according to the callback, overriding the browser default", () => {
      expect(window.scrollY).to.be.closeTo(123, 10);
    });
  });

  describe("with history", () => {
    beforeEach(function () {
      this.history = createBrowserHistory();
    });

    describe("on click", () => {
      beforeEach(async function () {
        scrollToFragment({
          history: this.history,
          scrollIntoView: () => window.scrollTo(0, 123),
        });
        document.getElementById("hashOnly")?.click();
        await wait();
      });

      it("scrolls, overriding the browser default", () => {
        expect(window.scrollY).to.be.closeTo(123, 10);
      });
    });

    describe("on PUSH", () => {
      beforeEach(async function () {
        scrollToFragment({ history: this.history });
        this.history.push("other.html#bottom10400");
        await wait();
      });

      it("scrolls to the matching element", () => {
        expect(window.scrollY).to.be.closeTo(10400, 1000);
      });
    });
  });
});

function wait(frames = 3): Promise<void> {
  return new Promise((resolve) => {
    function tick(n: number) {
      if (n === 0) resolve();
      else requestAnimationFrame(() => tick(n - 1));
    }
    tick(frames);
  });
}
