jest.mock("../Logger.js", () => ({
    i: jest.fn(),
    d: jest.fn(),
    e: jest.fn(),
    w: jest.fn(),
    v: jest.fn(),
}));

const Logger = require("../Logger.js");
const ViewsModule = require("../Views.js");

const Views = ViewsModule.default || ViewsModule;

function createViews() {
    return new Views({
        isInitialized: true,
        CountlyReactNative: {
            startAutoStoppedView: jest.fn().mockResolvedValue("auto-1"),
            startView: jest.fn().mockResolvedValue("manual-1"),
            stopViewWithName: jest.fn(),
            stopViewWithID: jest.fn(),
            stopAllViews: jest.fn(),
            pauseViewWithID: jest.fn(),
            resumeViewWithID: jest.fn(),
            addSegmentationToViewWithID: jest.fn(),
            addSegmentationToViewWithName: jest.fn(),
            setGlobalViewSegmentation: jest.fn(),
            updateGlobalViewSegmentation: jest.fn(),
        },
    });
}

afterEach(() => {
    jest.clearAllMocks();
});

test("views methods emit info logs with the invoked payload", async () => {
    const views = createViews();

    await views.startAutoStoppedView("Home", { region: "eu", premium: true });
    await views.startView("Checkout", { step: 2 });
    views.stopViewWithName("Checkout", { source: "button" });
    views.stopViewWithID("manual-1", { result: "success" });
    views.stopAllViews({ closedBy: "test" });
    views.pauseViewWithID("manual-1");
    views.resumeViewWithID("manual-1");
    views.addSegmentationToViewWithID("manual-1", { stage: "payment" });
    views.addSegmentationToViewWithName("Checkout", { stage: "review" });
    views.setGlobalViewSegmentation({ app: "example" });
    views.updateGlobalViewSegmentation({ tab: "views" });

    expect(Logger.i).toHaveBeenNthCalledWith(1, "startAutoStoppedView, called with view name: [Home], segmentation: [{\"region\":\"eu\",\"premium\":true}]");
    expect(Logger.i).toHaveBeenNthCalledWith(2, "startView, called with view name: [Checkout], segmentation: [{\"step\":2}]");
    expect(Logger.i).toHaveBeenNthCalledWith(3, "stopViewWithName, called with view name: [Checkout], segmentation: [{\"source\":\"button\"}]");
    expect(Logger.i).toHaveBeenNthCalledWith(4, "stopViewWithID, called with view ID: [manual-1], segmentation: [{\"result\":\"success\"}]");
    expect(Logger.i).toHaveBeenNthCalledWith(5, "stopAllViews, called with segmentation: [{\"closedBy\":\"test\"}]");
    expect(Logger.i).toHaveBeenNthCalledWith(6, "pauseViewWithID, called with view ID: [manual-1]");
    expect(Logger.i).toHaveBeenNthCalledWith(7, "resumeViewWithID, called with view ID: [manual-1]");
    expect(Logger.i).toHaveBeenNthCalledWith(8, "addSegmentationToViewWithID, called with view ID: [manual-1], segmentation: [{\"stage\":\"payment\"}]");
    expect(Logger.i).toHaveBeenNthCalledWith(9, "addSegmentationToViewWithName, called with view name: [Checkout], segmentation: [{\"stage\":\"review\"}]");
    expect(Logger.i).toHaveBeenNthCalledWith(10, "setGlobalViewSegmentation, called with segmentation: [{\"app\":\"example\"}]");
    expect(Logger.i).toHaveBeenNthCalledWith(11, "updateGlobalViewSegmentation, called with segmentation: [{\"tab\":\"views\"}]");
});