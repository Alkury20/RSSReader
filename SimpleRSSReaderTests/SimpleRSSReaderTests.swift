import UIKit
import XCTest
@testable import SimpleRSSReader

class SimpleRSSReaderTests: XCTestCase {
    
    var feedParser: FeedParser!
    
    override func setUp() {
        super.setUp()
        feedParser = FeedParser()
    }
    
    override func tearDown() {
        feedParser = nil
        super.tearDown()
    }
    
    func testFeedParserInitialization() {
        XCTAssertNotNil(feedParser, "FeedParser should be initialized")
    }
    
    func testRSSItemStructure() {
        let title = "Test Title"
        let description = "Test Description"
        let pubDate = "Mon, 01 Jan 2024 00:00:00 GMT"
        
        let item = (title: title, description: description, pubDate: pubDate)
        
        XCTAssertEqual(item.title, title)
        XCTAssertEqual(item.description, description)
        XCTAssertEqual(item.pubDate, pubDate)
    }
    
    func testNewsTableViewControllerInitialization() {
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let viewController = storyboard.instantiateViewController(withIdentifier: "NewsTableViewController") as? NewsTableViewController
        
        XCTAssertNotNil(viewController, "NewsTableViewController should be initialized from storyboard")
    }
    
    func testCellStateEnum() {
        let expandedState = CellState.expanded
        let collapsedState = CellState.collapsed
        
        XCTAssertNotEqual(expandedState, collapsedState)
    }
    
    func testFeedParserWithInvalidURL() {
        let expectation = self.expectation(description: "Invalid URL should not crash")
        
        feedParser.parseFeed(feedURL: "invalid-url") { items in
            XCTAssertEqual(items.count, 0, "Should return empty array for invalid URL")
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5.0, handler: nil)
    }
    
    func testPerformanceExample() {
        self.measure() {
            let _ = FeedParser()
        }
    }
}
