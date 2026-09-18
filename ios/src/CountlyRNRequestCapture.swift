// CountlyRNRequestCapture.swift
//
// This code is provided under the MIT License.
//
// Please visit www.count.ly for more information.

import Foundation

/// Captures the requests the SDK sends and answers them locally.
///
/// Used by the integration tests: with capture on, nothing reaches the network
/// and every request the SDK made is readable from JavaScript. The protocol is
/// installed on the SDK's session configuration at init, but stays dormant until
/// `isEnabled` is set, so a normal integration never sees it.
enum CountlyRNRequestCapture {

    /// Marks a request this protocol has already taken, so it is not taken twice.
    static let handledKey = "CountlyRNHandledRequestKey"

    static var isEnabled = false

    /// Only requests to the configured server are captured; anything else the host
    /// application sends is left alone.
    static var capturedHost: String?

    private(set) static var captured: [String] = []

    static func reset() {
        captured = []
    }

    static func record(_ request: URLRequest, kind: String) {
        let payload: [String: Any] = [
            "kind": kind,
            "url": request.url?.absoluteString ?? "",
            "path": request.url?.path ?? "",
            "httpMethod": request.httpMethod ?? "GET",
            "requestData": queryLikePayload(from: request),
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        captured.append(json)
    }

    static func shouldCapture(_ request: URLRequest) -> Bool {
        guard isEnabled, let host = capturedHost, !host.isEmpty, let url = request.url else { return false }
        guard URLProtocol.property(forKey: handledKey, in: request) == nil else { return false }
        return url.host == host
    }

    /// Returns a copy of the SDK's session configuration with the capture protocol
    /// in front.
    static func configuration(from source: URLSessionConfiguration) -> URLSessionConfiguration {
        let configuration = source
        var protocolClasses = configuration.protocolClasses ?? []
        if !protocolClasses.contains(where: { $0 == CountlyRNRequestCaptureProtocol.self }) {
            protocolClasses.insert(CountlyRNRequestCaptureProtocol.self, at: 0)
        }
        configuration.protocolClasses = protocolClasses
        return configuration
    }

    /// The request body, or the query string when there is no body, which is the
    /// form the assertions on the JavaScript side expect.
    private static func queryLikePayload(from request: URLRequest) -> String {
        if let body = request.httpBody, let text = String(data: body, encoding: .utf8), !text.isEmpty {
            return text
        }

        if let stream = request.httpBodyStream {
            stream.open()
            defer { stream.close() }

            var data = Data()
            let bufferSize = 1024
            var buffer = [UInt8](repeating: 0, count: bufferSize)
            while stream.hasBytesAvailable {
                let read = stream.read(&buffer, maxLength: bufferSize)
                if read <= 0 { break }
                data.append(buffer, count: read)
            }

            if let text = String(data: data, encoding: .utf8), !text.isEmpty {
                return text
            }
        }

        return request.url?.query ?? ""
    }

    /// The answer a captured request gets. The SDK only needs `/i` to look like a
    /// success for the request to leave its queue.
    static func responseData(for request: URLRequest) -> Data {
        let body = request.url?.path == "/i" ? "{\"result\":\"Success\"}" : "{}"
        return Data(body.utf8)
    }
}

/// Answers a captured request without letting it reach the network.
class CountlyRNRequestCaptureProtocol: URLProtocol {

    override class func canInit(with request: URLRequest) -> Bool {
        CountlyRNRequestCapture.shouldCapture(request)
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        let mutableRequest = (request as NSURLRequest).mutableCopy() as! NSMutableURLRequest
        URLProtocol.setProperty(true, forKey: CountlyRNRequestCapture.handledKey, in: mutableRequest)
        CountlyRNRequestCapture.record(mutableRequest as URLRequest, kind: "direct")

        guard let url = request.url,
              let response = HTTPURLResponse(url: url,
                                             statusCode: 200,
                                             httpVersion: nil,
                                             headerFields: ["Content-Type": "application/json"]) else {
            client?.urlProtocolDidFinishLoading(self)
            return
        }

        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: CountlyRNRequestCapture.responseData(for: request))
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}
